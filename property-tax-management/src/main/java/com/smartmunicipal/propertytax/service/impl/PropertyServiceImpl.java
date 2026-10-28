package com.smartmunicipal.propertytax.service.impl;

import com.smartmunicipal.propertytax.dto.PropertyRequest;
import com.smartmunicipal.propertytax.dto.PropertyResponse;
import com.smartmunicipal.propertytax.entity.Property;
import com.smartmunicipal.propertytax.entity.User;
import com.smartmunicipal.propertytax.enums.ConstructionType;
import com.smartmunicipal.propertytax.enums.PropertyStatus;
import com.smartmunicipal.propertytax.exception.DuplicatePropertyException;
import com.smartmunicipal.propertytax.exception.ResourceNotFoundException;
import com.smartmunicipal.propertytax.repository.PropertyRepository;
import com.smartmunicipal.propertytax.repository.UserRepository;
import com.smartmunicipal.propertytax.service.AuditLogService;
import com.smartmunicipal.propertytax.service.PropertyService;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class PropertyServiceImpl implements PropertyService {

    private static final Logger log = LoggerFactory.getLogger(PropertyServiceImpl.class);

    private final PropertyRepository propertyRepository;
    private final UserRepository userRepository;
    private final AuditLogService auditLogService;
    private final com.smartmunicipal.propertytax.service.NotificationService notificationService;

    @Override
    @Transactional
    public PropertyResponse createProperty(PropertyRequest request) {
        if (propertyRepository.existsByPropertyId(request.getPropertyId())) {
            throw new DuplicatePropertyException("Property with ID '" + request.getPropertyId() + "' already exists");
        }
        User owner = getUserOrThrow(request.getOwnerId());
        Property property = Property.builder()
                .propertyId(request.getPropertyId())
                .owner(owner)
                .address(request.getAddress())
                .wardNo(request.getWardNo())
                .areaSqft(request.getAreaSqft())
                .constructionType(request.getConstructionType())
                .assessedValue(request.getAssessedValue())
                .lat(request.getLat())
                .lng(request.getLng())
                .status(request.getStatus() != null ? request.getStatus() : PropertyStatus.ACTIVE)
                .build();
        Property saved = propertyRepository.save(property);
        PropertyResponse response = toResponse(saved);
        // FR4/FR16: property creation logged with actor identity
        try {
            auditLogService.log(resolveCurrentUserId(), "CREATE", "Property", saved.getId(),
                    "Property created: " + saved.getPropertyId() + " owner=" + owner.getId(), null);
        } catch (Exception auditEx) {
            log.warn("Audit log failed for Property create id={}: {}", saved.getId(), auditEx.getMessage());
        }

        try {
            notificationService.createNotification(
                    owner.getId(),
                    "IN_APP",
                    "PROPERTY_REGISTERED",
                    "Property " + saved.getPropertyId() + " has been successfully registered."
            );
        } catch (Exception ignored) {}

        return response;
    }

    @Override
    @Transactional(readOnly = true)
    public PropertyResponse findById(Long id) {
        return toResponse(getPropertyOrThrow(id));
    }

    @Override
    @Transactional(readOnly = true)
    public PropertyResponse findByPropertyId(String propertyId) {
        return toResponse(propertyRepository.findByPropertyId(propertyId)
                .orElseThrow(() -> new ResourceNotFoundException("Property not found with propertyId: " + propertyId)));
    }

    @Override
    @Transactional(readOnly = true)
    public List<PropertyResponse> findAll() {
        return propertyRepository.findAll().stream().map(p -> PropertyServiceImpl.toResponse(p)).collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<PropertyResponse> findByOwnerId(Long ownerId) {
        return propertyRepository.findByOwnerId(ownerId).stream().map(p -> PropertyServiceImpl.toResponse(p)).collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<PropertyResponse> findByWardNo(String wardNo) {
        return propertyRepository.findByWardNo(wardNo).stream().map(p -> PropertyServiceImpl.toResponse(p)).collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<PropertyResponse> findByStatus(PropertyStatus status) {
        return propertyRepository.findByStatus(status).stream().map(p -> PropertyServiceImpl.toResponse(p)).collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<PropertyResponse> findByConstructionType(ConstructionType constructionType) {
        return propertyRepository.findByConstructionType(constructionType).stream().map(p -> PropertyServiceImpl.toResponse(p)).collect(Collectors.toList());
    }

    @Override
    @Transactional
    public PropertyResponse updateProperty(Long id, PropertyRequest request) {
        Property property = getPropertyOrThrow(id);
        if (!property.getPropertyId().equals(request.getPropertyId())
                && propertyRepository.existsByPropertyId(request.getPropertyId())) {
            throw new DuplicatePropertyException("Property with ID '" + request.getPropertyId() + "' already exists");
        }
        User owner = getUserOrThrow(request.getOwnerId());
        property.setPropertyId(request.getPropertyId());
        property.setOwner(owner);
        property.setAddress(request.getAddress());
        property.setWardNo(request.getWardNo());
        property.setAreaSqft(request.getAreaSqft());
        property.setConstructionType(request.getConstructionType());
        property.setAssessedValue(request.getAssessedValue());
        property.setLat(request.getLat());
        property.setLng(request.getLng());
        if (request.getStatus() != null) {
            property.setStatus(request.getStatus());
        }
        Property saved = propertyRepository.save(property);
        PropertyResponse response = toResponse(saved);
        // FR4/FR16: property update — status transitions and modifications logged
        try {
            auditLogService.log(resolveCurrentUserId(), "UPDATE", "Property", saved.getId(),
                    "Property updated: " + saved.getPropertyId() + " status=" + saved.getStatus(), null);
        } catch (Exception auditEx) {
            log.warn("Audit log failed for Property update id={}: {}", saved.getId(), auditEx.getMessage());
        }
        return response;
    }

    @Override
    @Transactional
    public void deleteProperty(Long id) {
        Property property = getPropertyOrThrow(id);
        Long actorId = resolveCurrentUserId();
        String propertyIdStr = property.getPropertyId();
        propertyRepository.deleteById(id);
        // FR4/FR16: property deletion logged
        try {
            auditLogService.log(actorId, "DELETE", "Property", id,
                    "Property deleted: " + propertyIdStr, null);
        } catch (Exception auditEx) {
            log.warn("Audit log failed for Property delete id={}: {}", id, auditEx.getMessage());
        }
    }

    @Override
    @Transactional
    public PropertyResponse verifyProperty(Long id) {
        Property property = getPropertyOrThrow(id);
        property.setStatus(PropertyStatus.ACTIVE);
        Property saved = propertyRepository.save(property);
        try {
            auditLogService.log(resolveCurrentUserId(), "PROPERTY_VERIFIED", "Property", id,
                    "Property verified: " + saved.getPropertyId(), null);
        } catch (Exception auditEx) {
            log.warn("Audit log failed for Property verify id={}: {}", id, auditEx.getMessage());
        }

        try {
            if (saved.getOwner() != null) {
                notificationService.createNotification(
                        saved.getOwner().getId(),
                        "IN_APP",
                        "PROPERTY_VERIFIED",
                        "Property " + saved.getPropertyId() + " has been verified by the Ward Officer and is now ACTIVE."
                );
            }
        } catch (Exception ignored) {}

        return toResponse(saved);
    }

    @Override
    @Transactional
    public PropertyResponse updateStatus(Long id, PropertyStatus status) {
        Property property = getPropertyOrThrow(id);
        property.setStatus(status);
        Property saved = propertyRepository.save(property);
        try {
            auditLogService.log(resolveCurrentUserId(), "UPDATE_STATUS", "Property", id,
                    "Property status updated to " + status + " for " + saved.getPropertyId(), null);
        } catch (Exception auditEx) {
            log.warn("Audit log failed for Property updateStatus id={}: {}", id, auditEx.getMessage());
        }
        return toResponse(saved);
    }

    private Long resolveCurrentUserId() {
        var auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated()) return null;
        return userRepository.findByEmail(auth.getName()).map(User::getId).orElse(null);
    }

    private Property getPropertyOrThrow(Long id) {
        return propertyRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Property not found with id: " + id));
    }

    private User getUserOrThrow(Long id) {
        return userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + id));
    }

    public static PropertyResponse toResponse(Property p) {
        return new PropertyResponse(
                p.getId(),
                p.getPropertyId(),
                p.getOwner().getId(),
                p.getOwner().getName(),
                p.getAddress(),
                p.getWardNo(),
                p.getAreaSqft(),
                p.getConstructionType(),
                p.getAssessedValue(),
                p.getLat(),
                p.getLng(),
                p.getStatus()
        );
    }
}
