package com.smartmunicipal.propertytax.controller;

import com.smartmunicipal.propertytax.dto.ExemptionRequest;
import com.smartmunicipal.propertytax.dto.ExemptionResponse;
import com.smartmunicipal.propertytax.service.ExemptionService;
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
@RequestMapping("/api/exemptions")
@RequiredArgsConstructor
@SecurityRequirement(name = "bearerAuth")
@Tag(name = "Exemptions", description = "Property tax exemption management")
public class ExemptionController {

    private final ExemptionService exemptionService;

    @GetMapping
    @Operation(summary = "Get all exemptions")
    public ResponseEntity<List<ExemptionResponse>> getAll() {
        return ResponseEntity.ok(exemptionService.findAll());
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('FINANCE_OFFICER','ADMIN','COMMISSIONER')")
    @Operation(summary = "Create a new exemption")
    public ResponseEntity<ExemptionResponse> create(@Valid @RequestBody ExemptionRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(exemptionService.createExemption(request));
    }

    @PutMapping("/apply")
    @PreAuthorize("hasAnyRole('FINANCE_OFFICER','ADMIN','COMMISSIONER')")
    @Operation(summary = "Apply exemption — SRS Appendix H: PUT /api/exemptions/apply")
    public ResponseEntity<ExemptionResponse> apply(@Valid @RequestBody ExemptionRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(exemptionService.createExemption(request));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get exemption by ID")
    public ResponseEntity<ExemptionResponse> getById(@PathVariable Long id) {
        return ResponseEntity.ok(exemptionService.findById(id));
    }

    @GetMapping("/property/{propertyId}")
    @Operation(summary = "Get all exemptions for a property")
    public ResponseEntity<List<ExemptionResponse>> getByProperty(@PathVariable Long propertyId) {
        return ResponseEntity.ok(exemptionService.findByPropertyId(propertyId));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('FINANCE_OFFICER','ADMIN','COMMISSIONER')")
    @Operation(summary = "Update an exemption")
    public ResponseEntity<ExemptionResponse> update(@PathVariable Long id,
                                                    @Valid @RequestBody ExemptionRequest request) {
        return ResponseEntity.ok(exemptionService.updateExemption(id, request));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','COMMISSIONER')")
    @Operation(summary = "Delete an exemption (ADMIN/COMMISSIONER only)")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        exemptionService.deleteExemption(id);
        return ResponseEntity.noContent().build();
    }
}
