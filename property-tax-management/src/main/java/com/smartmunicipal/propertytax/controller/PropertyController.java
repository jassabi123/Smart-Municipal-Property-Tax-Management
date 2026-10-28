package com.smartmunicipal.propertytax.controller;

import com.smartmunicipal.propertytax.dto.PropertyRequest;
import com.smartmunicipal.propertytax.dto.PropertyResponse;
import com.smartmunicipal.propertytax.dto.TaxAssessmentResponse;
import com.smartmunicipal.propertytax.enums.ConstructionType;
import com.smartmunicipal.propertytax.enums.PropertyStatus;
import com.smartmunicipal.propertytax.service.PropertyService;
import com.smartmunicipal.propertytax.service.TaxAssessmentService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import com.smartmunicipal.propertytax.entity.User;
import com.smartmunicipal.propertytax.repository.UserRepository;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/properties")
@RequiredArgsConstructor
@SecurityRequirement(name = "bearerAuth")
@Tag(name = "Properties", description = "Property registration and management")
public class PropertyController {

    private final PropertyService propertyService;
    private final TaxAssessmentService assessmentService;
    private final UserRepository userRepository;

    @PostMapping
    @PreAuthorize("hasAnyRole('PROPERTY_OWNER','WARD_OFFICER','TAX_ASSESSOR','ADMIN','COMMISSIONER')")
    @Operation(summary = "Register a new property")
    public ResponseEntity<PropertyResponse> create(@Valid @RequestBody PropertyRequest request, Authentication authentication) {
        if (isOwner(authentication)) {
            request.setOwnerId(currentUserId(authentication));
            request.setStatus(PropertyStatus.PENDING_VERIFICATION);
        }
        return ResponseEntity.status(HttpStatus.CREATED).body(propertyService.createProperty(request));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get property by internal ID")
    public ResponseEntity<PropertyResponse> getById(@PathVariable Long id, Authentication authentication) {
        PropertyResponse property = propertyService.findById(id);
        if (isOwner(authentication) && !property.getOwnerId().equals(currentUserId(authentication))) {
            throw new AccessDeniedException("Property is outside the current user's scope");
        }
        return ResponseEntity.ok(property);
    }

    @GetMapping
    @Operation(summary = "List all properties with optional filters")
    public ResponseEntity<List<PropertyResponse>> getAll(
            @RequestParam(required = false) Long ownerId,
            @RequestParam(required = false) String wardNo,
            @RequestParam(required = false) PropertyStatus status,
            @RequestParam(required = false) ConstructionType constructionType,
            Authentication authentication) {

        if (isOwner(authentication)) {
            return ResponseEntity.ok(propertyService.findByOwnerId(currentUserId(authentication)));
        }
        if (ownerId != null)           return ResponseEntity.ok(propertyService.findByOwnerId(ownerId));
        if (wardNo != null)            return ResponseEntity.ok(propertyService.findByWardNo(wardNo));
        if (status != null)            return ResponseEntity.ok(propertyService.findByStatus(status));
        if (constructionType != null)  return ResponseEntity.ok(propertyService.findByConstructionType(constructionType));
        return ResponseEntity.ok(propertyService.findAll());
    }

    @GetMapping("/{id}/assessment")
    @Operation(summary = "Get all assessments for a property — SRS Appendix H")
    public ResponseEntity<List<TaxAssessmentResponse>> getAssessments(@PathVariable Long id, Authentication authentication) {
        if (isOwner(authentication)) {
            PropertyResponse property = propertyService.findById(id);
            if (!property.getOwnerId().equals(currentUserId(authentication))) {
                throw new AccessDeniedException("Property is outside the current user's scope");
            }
        }
        return ResponseEntity.ok(assessmentService.findByPropertyId(id));
    }

    private boolean isOwner(Authentication authentication) {
        return authentication != null && authentication.getAuthorities().stream()
                .anyMatch(a -> "ROLE_PROPERTY_OWNER".equals(a.getAuthority()));
    }

    private Long currentUserId(Authentication authentication) {
        return userRepository.findByEmail(authentication.getName()).map(User::getId)
                .orElseThrow(() -> new AccessDeniedException("Authenticated user was not found"));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('WARD_OFFICER','TAX_ASSESSOR','ADMIN','COMMISSIONER')")
    @Operation(summary = "Update property details")
    public ResponseEntity<PropertyResponse> update(@PathVariable Long id,
                                                   @Valid @RequestBody PropertyRequest request) {
        return ResponseEntity.ok(propertyService.updateProperty(id, request));
    }

    @PutMapping("/{id}/verify")
    @PreAuthorize("hasAnyRole('WARD_OFFICER','ADMIN')")
    @Operation(summary = "Verify property (Ward Officer / Admin)")
    public ResponseEntity<PropertyResponse> verify(@PathVariable Long id) {
        return ResponseEntity.ok(propertyService.verifyProperty(id));
    }

    @PutMapping("/{id}/status")
    @PreAuthorize("hasAnyRole('WARD_OFFICER','ADMIN')")
    @Operation(summary = "Update property status (Ward Officer / Admin)")
    public ResponseEntity<PropertyResponse> updateStatus(@PathVariable Long id, @RequestParam PropertyStatus status) {
        return ResponseEntity.ok(propertyService.updateStatus(id, status));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','COMMISSIONER')")
    @Operation(summary = "Delete a property (ADMIN/COMMISSIONER only)")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        propertyService.deleteProperty(id);
        return ResponseEntity.noContent().build();
    }
}
