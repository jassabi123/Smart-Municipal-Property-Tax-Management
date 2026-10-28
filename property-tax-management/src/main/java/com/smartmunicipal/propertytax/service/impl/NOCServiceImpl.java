package com.smartmunicipal.propertytax.service.impl;

import com.smartmunicipal.propertytax.dto.NOCRequestDto;
import com.smartmunicipal.propertytax.dto.NOCResponseDto;
import com.smartmunicipal.propertytax.entity.NOCRequest;
import com.smartmunicipal.propertytax.entity.Property;
import com.smartmunicipal.propertytax.entity.User;
import com.smartmunicipal.propertytax.exception.ResourceNotFoundException;
import com.smartmunicipal.propertytax.repository.NOCRequestRepository;
import com.smartmunicipal.propertytax.repository.PropertyRepository;
import com.smartmunicipal.propertytax.repository.UserRepository;
import com.smartmunicipal.propertytax.service.AuditLogService;
import com.smartmunicipal.propertytax.service.NOCService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class NOCServiceImpl implements NOCService {

    private final NOCRequestRepository nocRepository;
    private final PropertyRepository propertyRepository;
    private final UserRepository userRepository;
    private final AuditLogService auditLogService;
    private final com.smartmunicipal.propertytax.service.NotificationService notificationService;

    @Override
    @Transactional
    public NOCResponseDto requestNOC(NOCRequestDto request) {
        Property property = getPropertyOrThrow(request.getPropertyId());
        User requestedBy = getUserOrThrow(request.getRequestedById());

        NOCRequest noc = NOCRequest.builder()
                .property(property)
                .requestedBy(requestedBy)
                .status("PENDING")
                .build();

        NOCRequest saved = nocRepository.save(noc);
        // FR5/FR16: NOC request logged with requester identity
        auditLogService.log(requestedBy.getId(), "CREATE", "NOCRequest", saved.getId(),
                "NOC requested: property=" + property.getPropertyId()
                + " requestedBy=" + requestedBy.getId(), null);
        return toResponse(saved);
    }

    @Override
    @Transactional(readOnly = true)
    public NOCResponseDto findById(Long id) {
        return toResponse(getNocOrThrow(id));
    }

    @Override
    @Transactional(readOnly = true)
    public List<NOCResponseDto> findByPropertyId(Long propertyId) {
        return nocRepository.findByPropertyId(propertyId)
                .stream().map(n -> NOCServiceImpl.toResponse(n)).collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<NOCResponseDto> findByRequestedById(Long userId) {
        return nocRepository.findByRequestedById(userId)
                .stream().map(n -> NOCServiceImpl.toResponse(n)).collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<NOCResponseDto> findByStatus(String status) {
        return nocRepository.findByStatus(status)
                .stream().map(n -> NOCServiceImpl.toResponse(n)).collect(Collectors.toList());
    }

    @Override
    @Transactional
    public NOCResponseDto issueNOC(Long nocId, Long issuedById, String remarks) {
        NOCRequest noc = getNocOrThrow(nocId);
        if (!"PENDING".equals(noc.getStatus())) {
            throw new IllegalStateException("NOC is not in PENDING state");
        }
        User issuedBy = getUserOrThrow(issuedById);
        noc.setIssuedBy(issuedBy);
        noc.setStatus("ISSUED");
        noc.setIssueDate(LocalDateTime.now());
        noc.setRemarks(remarks);
        NOCRequest saved = nocRepository.save(noc);
        // FR5/FR16: NOC issuance logged with issuer identity
        auditLogService.log(issuedBy.getId(), "NOC_APPROVED", "NOCRequest", saved.getId(),
                "NOC issued: property=" + saved.getProperty().getPropertyId()
                + " issuedBy=" + issuedBy.getId(), null);

        try {
            if (saved.getRequestedBy() != null) {
                notificationService.createNotification(
                        saved.getRequestedBy().getId(),
                        "IN_APP",
                        "NOC_ISSUED",
                        "Your NOC request for property " + saved.getProperty().getPropertyId() + " has been approved and issued."
                );
            }
        } catch (Exception ignored) {}

        return toResponse(saved);
    }

    @Override
    @Transactional
    public NOCResponseDto rejectNOC(Long nocId, Long issuedById, String remarks) {
        NOCRequest noc = getNocOrThrow(nocId);
        if (!"PENDING".equals(noc.getStatus())) {
            throw new IllegalStateException("NOC is not in PENDING state");
        }
        User officer = getUserOrThrow(issuedById);
        noc.setIssuedBy(officer);
        noc.setStatus("REJECTED");
        noc.setRemarks(remarks != null ? remarks : "Rejected by municipal authority");
        NOCRequest saved = nocRepository.save(noc);
        auditLogService.log(officer.getId(), "UPDATE", "NOCRequest", saved.getId(),
                "NOC rejected: property=" + saved.getProperty().getPropertyId()
                + " by=" + officer.getId(), null);

        try {
            if (saved.getRequestedBy() != null) {
                notificationService.createNotification(
                        saved.getRequestedBy().getId(),
                        "IN_APP",
                        "NOC_REJECTED",
                        "Your NOC request for property " + saved.getProperty().getPropertyId() + " was rejected: " + noc.getRemarks()
                );
            }
        } catch (Exception ignored) {}

        return toResponse(saved);
    }

    @Override
    @Transactional(readOnly = true)
    public List<NOCResponseDto> findAll() {
        return nocRepository.findAll().stream().map(NOCServiceImpl::toResponse).collect(Collectors.toList());
    }

    private NOCRequest getNocOrThrow(Long id) {
        return nocRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("NOC request not found with id: " + id));
    }

    private Property getPropertyOrThrow(Long id) {
        return propertyRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Property not found with id: " + id));
    }

    private User getUserOrThrow(Long id) {
        return userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + id));
    }

    public static NOCResponseDto toResponse(NOCRequest n) {
        return new NOCResponseDto(
                n.getId(),
                n.getProperty().getId(),
                n.getProperty().getPropertyId(),
                n.getRequestedBy().getId(),
                n.getRequestedBy().getName(),
                n.getIssuedBy() != null ? n.getIssuedBy().getId() : null,
                n.getIssuedBy() != null ? n.getIssuedBy().getName() : null,
                n.getStatus(),
                n.getRequestDate(),
                n.getIssueDate(),
                n.getRemarks()
        );
    }
}
