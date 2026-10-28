package com.smartmunicipal.propertytax.service.impl;

import com.smartmunicipal.propertytax.dto.GrievanceRequest;
import com.smartmunicipal.propertytax.dto.GrievanceResponse;
import com.smartmunicipal.propertytax.entity.Grievance;
import com.smartmunicipal.propertytax.entity.Property;
import com.smartmunicipal.propertytax.entity.User;
import com.smartmunicipal.propertytax.exception.ResourceNotFoundException;
import com.smartmunicipal.propertytax.repository.GrievanceRepository;
import com.smartmunicipal.propertytax.repository.PropertyRepository;
import com.smartmunicipal.propertytax.repository.UserRepository;
import com.smartmunicipal.propertytax.service.AuditLogService;
import com.smartmunicipal.propertytax.service.GrievanceService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class GrievanceServiceImpl implements GrievanceService {

    private final GrievanceRepository grievanceRepository;
    private final UserRepository userRepository;
    private final PropertyRepository propertyRepository;
    private final AuditLogService auditLogService;
    private final com.smartmunicipal.propertytax.service.NotificationService notificationService;

    @Override
    @Transactional
    public GrievanceResponse submitGrievance(Long userId, GrievanceRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + userId));

        Property property = null;
        if (request.getPropertyId() != null) {
            property = propertyRepository.findById(request.getPropertyId()).orElse(null);
        }

        Grievance grievance = Grievance.builder()
                .user(user)
                .property(property)
                .subject(request.getSubject())
                .description(request.getDescription())
                .status("SUBMITTED")
                .build();

        Grievance saved = grievanceRepository.save(grievance);
        try {
            auditLogService.log(userId, "SUBMIT_GRIEVANCE", "Grievance", saved.getId(), "Submitted grievance: " + saved.getSubject(), null);
        } catch (Exception ignored) {}

        return toResponse(saved);
    }

    @Override
    @Transactional(readOnly = true)
    public List<GrievanceResponse> getMyGrievances(Long userId) {
        return grievanceRepository.findByUserIdOrderByCreatedAtDesc(userId).stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<GrievanceResponse> getAllGrievances() {
        return grievanceRepository.findAll().stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public GrievanceResponse updateStatus(Long id, String status, String remarks) {
        Grievance grievance = grievanceRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Grievance not found with id: " + id));

        grievance.setStatus(status != null ? status.toUpperCase() : "RESOLVED");
        if (remarks != null) {
            grievance.setResolutionRemarks(remarks);
        }
        Grievance saved = grievanceRepository.save(grievance);

        try {
            if (saved.getUser() != null) {
                notificationService.createNotification(
                        saved.getUser().getId(),
                        "IN_APP",
                        "GRIEVANCE_UPDATE",
                        "Your grievance #" + saved.getId() + " ('" + saved.getSubject() + "') status updated to: " + saved.getStatus()
                );
            }
        } catch (Exception ignored) {}

        return toResponse(saved);
    }

    private GrievanceResponse toResponse(Grievance g) {
        return GrievanceResponse.builder()
                .id(g.getId())
                .userId(g.getUser() != null ? g.getUser().getId() : null)
                .userName(g.getUser() != null ? g.getUser().getName() : null)
                .propertyId(g.getProperty() != null ? g.getProperty().getId() : null)
                .propertyCustomId(g.getProperty() != null ? g.getProperty().getPropertyId() : null)
                .subject(g.getSubject())
                .description(g.getDescription())
                .status(g.getStatus())
                .resolutionRemarks(g.getResolutionRemarks())
                .createdAt(g.getCreatedAt())
                .updatedAt(g.getUpdatedAt())
                .build();
    }
}
