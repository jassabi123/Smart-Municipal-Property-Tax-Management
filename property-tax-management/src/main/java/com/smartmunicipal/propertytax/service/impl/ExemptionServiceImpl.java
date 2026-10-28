package com.smartmunicipal.propertytax.service.impl;

import com.smartmunicipal.propertytax.dto.ExemptionRequest;
import com.smartmunicipal.propertytax.dto.ExemptionResponse;
import com.smartmunicipal.propertytax.entity.Exemption;
import com.smartmunicipal.propertytax.entity.Property;
import com.smartmunicipal.propertytax.entity.User;
import com.smartmunicipal.propertytax.exception.ResourceNotFoundException;
import com.smartmunicipal.propertytax.repository.ExemptionRepository;
import com.smartmunicipal.propertytax.repository.PropertyRepository;
import com.smartmunicipal.propertytax.repository.UserRepository;
import com.smartmunicipal.propertytax.service.AuditLogService;
import com.smartmunicipal.propertytax.service.ExemptionService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ExemptionServiceImpl implements ExemptionService {

    private final ExemptionRepository exemptionRepository;
    private final PropertyRepository propertyRepository;
    private final UserRepository userRepository;
    private final AuditLogService auditLogService;

    @Override
    @Transactional
    public ExemptionResponse createExemption(ExemptionRequest request) {
        validateDateRange(request.getValidFrom(), request.getValidTo());
        checkNoOverlap(request.getPropertyId(), request.getExemptionType(),
                request.getValidFrom(), request.getValidTo(), null);

        Property property = getPropertyOrThrow(request.getPropertyId());
        User approvedBy = getUserOrThrow(request.getApprovedById());

        Exemption exemption = Exemption.builder()
                .property(property)
                .exemptionType(request.getExemptionType())
                .percentage(request.getPercentage())
                .validFrom(request.getValidFrom())
                .validTo(request.getValidTo())
                .approvedBy(approvedBy)
                .build();

        Exemption saved = exemptionRepository.save(exemption);

        // FR16: exemption creation logged with approver identity
        auditLogService.log(
                approvedBy.getId(),
                "CREATE",
                "Exemption",
                saved.getId(),
                "Exemption created: property="
                        + property.getPropertyId()
                        + " type="
                        + saved.getExemptionType()
                        + " pct="
                        + saved.getPercentage(),
                null
        );

        return toResponse(saved);
    }

    @Override
    @Transactional(readOnly = true)
    public List<ExemptionResponse> findAll() {
        return exemptionRepository.findAll()
                .stream()
                .map(ExemptionServiceImpl::toResponse)
                .collect(Collectors.toList());
    }

    @Override
    public ExemptionResponse findById(Long id) {
        return toResponse(getExemptionOrThrow(id));
    }

    @Override
    public List<ExemptionResponse> findByPropertyId(Long propertyId) {
        return exemptionRepository.findByPropertyId(propertyId)
                .stream()
                .map(e -> ExemptionServiceImpl.toResponse(e))
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public ExemptionResponse updateExemption(
            Long id,
            ExemptionRequest request) {

        validateDateRange(request.getValidFrom(), request.getValidTo());
        checkNoOverlap(request.getPropertyId(), request.getExemptionType(),
                request.getValidFrom(), request.getValidTo(), id);

        Exemption exemption = getExemptionOrThrow(id);
        Property property = getPropertyOrThrow(request.getPropertyId());
        User approvedBy = getUserOrThrow(request.getApprovedById());

        exemption.setProperty(property);
        exemption.setExemptionType(request.getExemptionType());
        exemption.setPercentage(request.getPercentage());
        exemption.setValidFrom(request.getValidFrom());
        exemption.setValidTo(request.getValidTo());
        exemption.setApprovedBy(approvedBy);

        Exemption saved = exemptionRepository.save(exemption);

        // FR16: exemption update logged with approver identity
        auditLogService.log(
                approvedBy.getId(),
                "UPDATE",
                "Exemption",
                saved.getId(),
                "Exemption updated: property="
                        + property.getPropertyId()
                        + " type="
                        + saved.getExemptionType()
                        + " pct="
                        + saved.getPercentage(),
                null
        );

        return toResponse(saved);
    }

    @Override
    @Transactional
    public void deleteExemption(Long id) {
        Exemption exemption = getExemptionOrThrow(id);

        Long performedById = resolveCurrentUserId();

        exemptionRepository.deleteById(id);

        // FR16: exemption deletion logged
        auditLogService.log(
                performedById,
                "DELETE",
                "Exemption",
                exemption.getId(),
                "Exemption deleted: property="
                        + exemption.getProperty().getPropertyId()
                        + " type="
                        + exemption.getExemptionType(),
                null
        );
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

    /**
     * Validates that validFrom is strictly before validTo.
     * Exact same dates are rejected (zero-length exemption window).
     */
    private void validateDateRange(LocalDate validFrom, LocalDate validTo) {
        if (!validFrom.isBefore(validTo)) {
            throw new IllegalArgumentException(
                    "Effective date must be before expiry date"
            );
        }
    }

    /**
     * Checks that no existing exemption for the same property + category
     * overlaps the requested [newFrom, newTo] window.
     * Pass excludeId = current record ID during updates to avoid self-conflict.
     */
    private void checkNoOverlap(
            Long propertyId,
            String exemptionType,
            LocalDate newFrom,
            LocalDate newTo,
            Long excludeId) {

        List<Exemption> conflicts = exemptionRepository.findOverlapping(
                propertyId, exemptionType, newFrom, newTo, excludeId);

        if (!conflicts.isEmpty()) {
            String readableType = exemptionType
                    .replace('_', ' ')
                    .toLowerCase();
            // Capitalise first letter
            readableType = readableType.substring(0, 1).toUpperCase()
                    + readableType.substring(1);
            throw new IllegalArgumentException(
                    "An active " + readableType
                    + " exemption already exists for this property during the selected period."
                    + " Please choose a non-overlapping date range."
            );
        }
    }

    private Exemption getExemptionOrThrow(Long id) {
        return exemptionRepository.findById(id)
                .orElseThrow(() ->
                        new ResourceNotFoundException(
                                "Exemption not found with id: " + id
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

    private User getUserOrThrow(Long id) {
        return userRepository.findById(id)
                .orElseThrow(() ->
                        new ResourceNotFoundException(
                                "User not found with id: " + id
                        )
                );
    }

    public static ExemptionResponse toResponse(Exemption e) {
        return new ExemptionResponse(
                e.getId(),
                e.getProperty().getId(),
                e.getProperty().getPropertyId(),
                e.getExemptionType(),
                e.getPercentage(),
                e.getValidFrom(),
                e.getValidTo(),
                e.getApprovedBy() != null
                        ? e.getApprovedBy().getId()
                        : null,
                e.getApprovedBy() != null
                        ? e.getApprovedBy().getName()
                        : null
        );
    }
}