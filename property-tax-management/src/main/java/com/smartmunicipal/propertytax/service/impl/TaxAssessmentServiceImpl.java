package com.smartmunicipal.propertytax.service.impl;

import com.smartmunicipal.propertytax.dto.TaxAssessmentRequest;
import com.smartmunicipal.propertytax.dto.TaxAssessmentResponse;
import com.smartmunicipal.propertytax.entity.Property;
import com.smartmunicipal.propertytax.entity.TaxAssessment;
import com.smartmunicipal.propertytax.entity.User;
import com.smartmunicipal.propertytax.enums.TaxAssessmentStatus;
import com.smartmunicipal.propertytax.exception.ResourceNotFoundException;
import com.smartmunicipal.propertytax.repository.PropertyRepository;
import com.smartmunicipal.propertytax.repository.TaxAssessmentRepository;
import com.smartmunicipal.propertytax.repository.UserRepository;
import com.smartmunicipal.propertytax.service.AuditLogService;
import com.smartmunicipal.propertytax.service.TaxAssessmentService;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class TaxAssessmentServiceImpl implements TaxAssessmentService {

    private static final Logger log = LoggerFactory.getLogger(TaxAssessmentServiceImpl.class);

    private final TaxAssessmentRepository assessmentRepository;
    private final PropertyRepository propertyRepository;
    private final UserRepository userRepository;
    private final AuditLogService auditLogService;
    private final com.smartmunicipal.propertytax.service.NotificationService notificationService;

    @Override
    @Transactional
    public TaxAssessmentResponse createAssessment(TaxAssessmentRequest request) {
        Property property = getPropertyOrThrow(request.getPropertyId());

        assessmentRepository.findByPropertyIdAndFinancialYear(
                request.getPropertyId(),
                request.getFinancialYear()
        ).ifPresent(a -> {
            throw new IllegalArgumentException(
                    "Assessment already exists for property "
                            + request.getPropertyId()
                            + " in year "
                            + request.getFinancialYear()
            );
        });

        BigDecimal penalty = request.getPenalty() != null
                ? request.getPenalty()
                : BigDecimal.ZERO;

        BigDecimal totalDue = request.getTaxAmount().add(penalty);

        TaxAssessment assessment = TaxAssessment.builder()
                .property(property)
                .financialYear(request.getFinancialYear())
                .taxAmount(request.getTaxAmount())
                .penalty(penalty)
                .totalDue(totalDue)
                .status(request.getStatus() != null
                        ? request.getStatus()
                        : TaxAssessmentStatus.PENDING)
                .dueDate(request.getDueDate())
                .build();

        TaxAssessment saved = assessmentRepository.save(assessment);

        // Capture response before REQUIRES_NEW audit transaction suspends outer tx
        TaxAssessmentResponse response = toResponse(saved);

        // FR5/FR16: assessment creation logged — failure must not roll back the main operation
        try {
            auditLogService.log(
                    resolveCurrentUserId(),
                    "CREATE",
                    "TaxAssessment",
                    saved.getId(),
                    "Assessment created for property="
                            + property.getPropertyId()
                            + " year="
                            + saved.getFinancialYear()
                            + " totalDue="
                            + saved.getTotalDue(),
                    null
            );
        } catch (Exception auditEx) {
            log.warn("Audit log failed for TaxAssessment id={}: {}", saved.getId(), auditEx.getMessage());
        }

        try {
            if (property.getOwner() != null) {
                notificationService.createNotification(
                        property.getOwner().getId(),
                        "IN_APP",
                        "ASSESSMENT_GENERATED",
                        "Tax assessment of ₹" + saved.getTotalDue() + " generated for FY "
                                + saved.getFinancialYear() + " on property " + property.getPropertyId()
                );
            }
        } catch (Exception ignored) {}

        return response;
    }

    @Override
    @Transactional(readOnly = true)
    public TaxAssessmentResponse findById(Long id) {
        return assessmentRepository.findByIdWithProperty(id)
                .map(TaxAssessmentServiceImpl::toResponse)
                .orElseThrow(() -> new ResourceNotFoundException("Tax assessment not found with id: " + id));
    }

    @Override
    @Transactional(readOnly = true)
    public List<TaxAssessmentResponse> findByPropertyId(Long propertyId) {
        return assessmentRepository.findByPropertyId(propertyId)
                .stream()
                .map(TaxAssessmentServiceImpl::toResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<TaxAssessmentResponse> findByStatus(
            TaxAssessmentStatus status) {

        return assessmentRepository.findByStatusWithProperty(status)
                .stream()
                .map(TaxAssessmentServiceImpl::toResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<TaxAssessmentResponse> findByFinancialYear(
            String financialYear) {

        return assessmentRepository.findByFinancialYearWithProperty(financialYear)
                .stream()
                .map(TaxAssessmentServiceImpl::toResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<TaxAssessmentResponse> findDefaulters() {
        return assessmentRepository
                .findByStatusAndDueDateBefore(
                        TaxAssessmentStatus.DEFAULTED,
                        LocalDate.now()
                )
                .stream()
                .map(a -> TaxAssessmentServiceImpl.toResponse(a))
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public TaxAssessmentResponse updateAssessment(
            Long id,
            TaxAssessmentRequest request) {

        TaxAssessment assessment = getAssessmentOrThrow(id);

        BigDecimal penalty = request.getPenalty() != null
                ? request.getPenalty()
                : BigDecimal.ZERO;

        assessment.setTaxAmount(request.getTaxAmount());
        assessment.setPenalty(penalty);
        assessment.setTotalDue(request.getTaxAmount().add(penalty));
        assessment.setFinancialYear(request.getFinancialYear());

        if (request.getStatus() != null) {
            assessment.setStatus(request.getStatus());
        }

        if (request.getDueDate() != null) {
            assessment.setDueDate(request.getDueDate());
        }

        TaxAssessment saved = assessmentRepository.saveAndFlush(assessment);

        // Capture response before REQUIRES_NEW audit transaction suspends outer tx
        TaxAssessmentResponse response = toResponse(saved);

        // FR5/FR16: assessment update logged — failure must not roll back the main operation
        try {
            auditLogService.log(
                    resolveCurrentUserId(),
                    "UPDATE",
                    "TaxAssessment",
                    saved.getId(),
                    "Assessment updated: property="
                            + saved.getProperty().getPropertyId()
                            + " year="
                            + saved.getFinancialYear()
                            + " status="
                            + saved.getStatus(),
                    null
            );
        } catch (Exception auditEx) {
            log.warn("Audit log failed for TaxAssessment update id={}: {}", saved.getId(), auditEx.getMessage());
        }

        return response;
    }

    @Override
    @Transactional
    public void deleteAssessment(Long id) {
        TaxAssessment assessment = getAssessmentOrThrow(id);

        Long performedById = resolveCurrentUserId();

        assessmentRepository.deleteById(id);

        // FR16: assessment deletion logged — failure must not break the delete
        try {
            auditLogService.log(
                    performedById,
                    "DELETE",
                    "TaxAssessment",
                    assessment.getId(),
                    "Tax assessment deleted: property="
                            + assessment.getProperty().getPropertyId()
                            + " year="
                            + assessment.getFinancialYear(),
                    null
            );
        } catch (Exception auditEx) {
            log.warn("Audit log failed for TaxAssessment delete id={}: {}", assessment.getId(), auditEx.getMessage());
        }
    }

    @Override
    @Transactional(readOnly = true)
    public List<TaxAssessmentResponse> findByOwnerId(Long ownerId) {
        return assessmentRepository.findByOwnerIdWithProperty(ownerId)
                .stream()
                .map(TaxAssessmentServiceImpl::toResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<TaxAssessmentResponse> findAll() {
        return assessmentRepository.findAllWithProperty().stream()
                .map(TaxAssessmentServiceImpl::toResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public TaxAssessmentResponse applyPenalty(Long id, BigDecimal penalty) {
        TaxAssessment assessment = getAssessmentOrThrow(id);
        assessment.setPenalty(penalty != null ? penalty : BigDecimal.ZERO);
        assessment.setTotalDue(assessment.getTaxAmount().add(assessment.getPenalty()));
        TaxAssessment saved = assessmentRepository.saveAndFlush(assessment);
        try {
            auditLogService.log(resolveCurrentUserId(), "APPLY_PENALTY", "TaxAssessment", id,
                    "Penalty applied: " + penalty + " to assessment " + id, null);
        } catch (Exception ignored) {}
        return toResponse(saved);
    }

    private Long resolveCurrentUserId() {
        var auth = SecurityContextHolder
                .getContext()
                .getAuthentication();

        if (auth == null || !auth.isAuthenticated()) {
            return null;
        }

        return userRepository
                .findByEmail(auth.getName())
                .map(User::getId)
                .orElse(null);
    }

    private TaxAssessment getAssessmentOrThrow(Long id) {
        return assessmentRepository.findById(id)
                .orElseThrow(() ->
                        new ResourceNotFoundException(
                                "Tax assessment not found with id: " + id
                        )
                );
    }

    private Property getPropertyOrThrow(Long id) {
        return propertyRepository.findById(id)
                .orElseThrow(() ->
                        new ResourceNotFoundException(
                                "Property not found with id: " + id
                        )
                );
    }

    public static TaxAssessmentResponse toResponse(TaxAssessment a) {
        Long propId = null;
        String propIdentifier = null;
        String wardNo = null;
        String ownerName = null;

        if (a.getProperty() != null) {
            propId = a.getProperty().getId();
            propIdentifier = a.getProperty().getPropertyId();
            wardNo = a.getProperty().getWardNo();
            if (a.getProperty().getOwner() != null) {
                ownerName = a.getProperty().getOwner().getName();
            }
        }

        return TaxAssessmentResponse.builder()
                .id(a.getId())
                .propertyId(propId)
                .propertyIdentifier(propIdentifier)
                .financialYear(a.getFinancialYear())
                .taxAmount(a.getTaxAmount())
                .penalty(a.getPenalty())
                .totalDue(a.getTotalDue())
                .status(a.getStatus())
                .dueDate(a.getDueDate())
                .wardNo(wardNo)
                .ward(wardNo)
                .ownerName(ownerName)
                .build();
    }
}