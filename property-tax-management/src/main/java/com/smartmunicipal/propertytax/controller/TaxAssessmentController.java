package com.smartmunicipal.propertytax.controller;

import com.smartmunicipal.propertytax.dto.TaxAssessmentRequest;
import com.smartmunicipal.propertytax.dto.TaxAssessmentResponse;
import com.smartmunicipal.propertytax.enums.TaxAssessmentStatus;
import com.smartmunicipal.propertytax.service.TaxAssessmentService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequiredArgsConstructor
@SecurityRequirement(name = "bearerAuth")
@Tag(name = "Tax Assessments", description = "Tax assessment management")
public class TaxAssessmentController {

    private final TaxAssessmentService assessmentService;
    private final com.smartmunicipal.propertytax.service.PropertyService propertyService;
    private final com.smartmunicipal.propertytax.repository.UserRepository userRepository;

    @PostMapping({"/api/assessments", "/api/tax-assessments"})
    @PreAuthorize("hasAnyRole('TAX_ASSESSOR','ADMIN','COMMISSIONER')")
    @Operation(summary = "Create a new tax assessment")
    public ResponseEntity<TaxAssessmentResponse> create(@Valid @RequestBody TaxAssessmentRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(assessmentService.createAssessment(request));
    }

    @PostMapping({"/api/assessments/run", "/api/tax-assessments/run"})
    @PreAuthorize("hasAnyRole('TAX_ASSESSOR','ADMIN','COMMISSIONER')")
    @Operation(summary = "Run/create assessment — SRS Appendix H: POST /api/assessments/run")
    public ResponseEntity<TaxAssessmentResponse> run(@Valid @RequestBody TaxAssessmentRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(assessmentService.createAssessment(request));
    }

    @GetMapping({"/api/assessments/{id}", "/api/tax-assessments/{id}"})
    @Operation(summary = "Get assessment by ID")
    public ResponseEntity<TaxAssessmentResponse> getById(@PathVariable Long id, org.springframework.security.core.Authentication authentication) {
        TaxAssessmentResponse assessment = assessmentService.findById(id);
        if (isOwner(authentication)) {
            var prop = propertyService.findById(assessment.getPropertyId());
            if (!prop.getOwnerId().equals(currentUserId(authentication))) {
                throw new org.springframework.security.access.AccessDeniedException("Assessment is outside the current user's scope");
            }
        }
        return ResponseEntity.ok(assessment);
    }

    @GetMapping({"/api/assessments", "/api/tax-assessments"})
    @Operation(summary = "List assessments with optional filters")
    public ResponseEntity<List<TaxAssessmentResponse>> getAll(
            @RequestParam(required = false) TaxAssessmentStatus status,
            @RequestParam(required = false) String financialYear,
            org.springframework.security.core.Authentication authentication) {

        if (isOwner(authentication)) {
            return ResponseEntity.ok(assessmentService.findByOwnerId(currentUserId(authentication)));
        }
        if (status != null)        return ResponseEntity.ok(assessmentService.findByStatus(status));
        if (financialYear != null) return ResponseEntity.ok(assessmentService.findByFinancialYear(financialYear));
        return ResponseEntity.ok(assessmentService.findAll());
    }

    @PostMapping({"/api/assessments/calculate", "/api/tax-assessments/calculate"})
    @PreAuthorize("hasAnyRole('TAX_ASSESSOR','ADMIN','COMMISSIONER')")
    @Operation(summary = "Calculate property tax based on construction type, area, and ward")
    public ResponseEntity<java.util.Map<String, Object>> calculateTax(
            @RequestParam java.math.BigDecimal areaSqft,
            @RequestParam com.smartmunicipal.propertytax.enums.ConstructionType constructionType,
            @RequestParam(required = false, defaultValue = "W-01") String wardNo) {

        java.math.BigDecimal baseRate = switch (constructionType) {
            case RESIDENTIAL -> new java.math.BigDecimal("15.00");
            case COMMERCIAL -> new java.math.BigDecimal("25.00");
            case INDUSTRIAL -> new java.math.BigDecimal("35.00");
            case VACANT -> new java.math.BigDecimal("8.00");
        };

        java.math.BigDecimal calculatedTax = areaSqft.multiply(baseRate);
        java.util.Map<String, Object> result = new java.util.LinkedHashMap<>();
        result.put("areaSqft", areaSqft);
        result.put("constructionType", constructionType);
        result.put("wardNo", wardNo);
        result.put("baseRatePerSqft", baseRate);
        result.put("calculatedTax", calculatedTax);
        result.put("totalDue", calculatedTax);
        return ResponseEntity.ok(result);
    }

    @PutMapping({"/api/assessments/{id}/penalty", "/api/tax-assessments/{id}/penalty"})
    @PreAuthorize("hasAnyRole('TAX_ASSESSOR','ADMIN','COMMISSIONER')")
    @Operation(summary = "Apply penalty to an assessment")
    public ResponseEntity<TaxAssessmentResponse> applyPenalty(
            @PathVariable Long id,
            @RequestParam java.math.BigDecimal penalty) {
        return ResponseEntity.ok(assessmentService.applyPenalty(id, penalty));
    }

    @PutMapping({"/api/assessments/{id}", "/api/tax-assessments/{id}"})
    @PreAuthorize("hasAnyRole('TAX_ASSESSOR','ADMIN','COMMISSIONER')")
    @Operation(summary = "Update an assessment")
    public ResponseEntity<TaxAssessmentResponse> update(@PathVariable Long id,
                                                        @Valid @RequestBody TaxAssessmentRequest request) {
        return ResponseEntity.ok(assessmentService.updateAssessment(id, request));
    }

    @DeleteMapping({"/api/assessments/{id}", "/api/tax-assessments/{id}"})
    @PreAuthorize("hasAnyRole('ADMIN','COMMISSIONER')")
    @Operation(summary = "Delete an assessment (ADMIN/COMMISSIONER only)")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        assessmentService.deleteAssessment(id);
        return ResponseEntity.noContent().build();
    }

    private boolean isOwner(org.springframework.security.core.Authentication authentication) {
        return authentication != null && authentication.getAuthorities().stream()
                .anyMatch(a -> "ROLE_PROPERTY_OWNER".equals(a.getAuthority()));
    }

    private Long currentUserId(org.springframework.security.core.Authentication authentication) {
        return userRepository.findByEmail(authentication.getName())
                .map(com.smartmunicipal.propertytax.entity.User::getId)
                .orElseThrow(() -> new org.springframework.security.access.AccessDeniedException("Authenticated user not found"));
    }
}
