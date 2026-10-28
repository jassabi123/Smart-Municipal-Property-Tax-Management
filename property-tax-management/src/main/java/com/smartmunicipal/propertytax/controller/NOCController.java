package com.smartmunicipal.propertytax.controller;

import com.smartmunicipal.propertytax.dto.NOCRequestDto;
import com.smartmunicipal.propertytax.dto.NOCResponseDto;
import com.smartmunicipal.propertytax.service.NOCService;
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
@RequestMapping("/api/noc")
@RequiredArgsConstructor
@SecurityRequirement(name = "bearerAuth")
@Tag(name = "NOC", description = "No Objection Certificate management")
public class NOCController {

    private final NOCService nocService;
    private final com.smartmunicipal.propertytax.service.PropertyService propertyService;
    private final com.smartmunicipal.propertytax.repository.UserRepository userRepository;

    @GetMapping
    @Operation(summary = "List NOC requests (staff sees all, owner sees own)")
    public ResponseEntity<List<NOCResponseDto>> getAll(
            @RequestParam(required = false) String status,
            org.springframework.security.core.Authentication auth) {
        if (isOwner(auth)) {
            return ResponseEntity.ok(nocService.findByRequestedById(currentUserId(auth)));
        }
        if (status != null) {
            return ResponseEntity.ok(nocService.findByStatus(status));
        }
        return ResponseEntity.ok(nocService.findAll());
    }

    @PostMapping("/request")
    @Operation(summary = "Request a NOC — SRS Appendix H: POST /api/noc/request")
    public ResponseEntity<NOCResponseDto> request(@Valid @RequestBody NOCRequestDto request, org.springframework.security.core.Authentication auth) {
        if (isOwner(auth)) {
            request.setRequestedById(currentUserId(auth));
            var prop = propertyService.findById(request.getPropertyId());
            if (!prop.getOwnerId().equals(currentUserId(auth))) {
                throw new org.springframework.security.access.AccessDeniedException("Property is outside the current user's scope");
            }
        }
        return ResponseEntity.status(HttpStatus.CREATED).body(nocService.requestNOC(request));
    }

    @GetMapping("/{id}/status")
    @Operation(summary = "Get NOC status — SRS Appendix H: GET /api/noc/{id}/status")
    public ResponseEntity<NOCResponseDto> getStatus(@PathVariable Long id, org.springframework.security.core.Authentication auth) {
        NOCResponseDto noc = nocService.findById(id);
        if (isOwner(auth) && !noc.getRequestedById().equals(currentUserId(auth))) {
            throw new org.springframework.security.access.AccessDeniedException("NOC request is outside current user's scope");
        }
        return ResponseEntity.ok(noc);
    }

    @RequestMapping(value = {"/{id}/issue", "/{id}/approve"}, method = {RequestMethod.PUT, RequestMethod.POST})
    @PreAuthorize("hasAnyRole('WARD_OFFICER','COMMISSIONER','ADMIN')")
    @Operation(summary = "Issue / Approve a NOC — SRS Appendix H: PUT /api/noc/{id}/issue")
    public ResponseEntity<NOCResponseDto> issue(
            @PathVariable Long id,
            @RequestBody(required = false) com.smartmunicipal.propertytax.dto.NOCApprovalRequest body,
            @RequestParam(required = false) Long issuedById,
            @RequestParam(required = false) Long approvedById,
            @RequestParam(required = false) String remarks,
            org.springframework.security.core.Authentication auth) {
        Long officerId = null;
        if (body != null) {
            officerId = body.getApprovedById() != null ? body.getApprovedById()
                    : (body.getIssuedById() != null ? body.getIssuedById()
                    : body.getOfficerId());
        }
        if (officerId == null) {
            officerId = issuedById != null ? issuedById : approvedById;
        }
        if (officerId == null) {
            officerId = currentUserId(auth);
        }

        String finalRemarks = null;
        if (body != null && body.getRemarks() != null && !body.getRemarks().isBlank()) {
            finalRemarks = body.getRemarks().trim();
        } else if (remarks != null && !remarks.isBlank()) {
            finalRemarks = remarks.trim();
        } else {
            finalRemarks = "All municipal tax dues verified as cleared.";
        }

        return ResponseEntity.ok(nocService.issueNOC(id, officerId, finalRemarks));
    }

    @RequestMapping(value = {"/issue", "/approve"}, method = {RequestMethod.PUT, RequestMethod.POST})
    @PreAuthorize("hasAnyRole('WARD_OFFICER','COMMISSIONER','ADMIN')")
    @Operation(summary = "Issue / Approve a NOC with ID in body or query param")
    public ResponseEntity<NOCResponseDto> issueWithBody(
            @RequestBody(required = false) com.smartmunicipal.propertytax.dto.NOCApprovalRequest body,
            @RequestParam(required = false) Long id,
            @RequestParam(required = false) Long issuedById,
            @RequestParam(required = false) Long approvedById,
            @RequestParam(required = false) String remarks,
            org.springframework.security.core.Authentication auth) {
        Long targetId = (body != null && body.getId() != null) ? body.getId() : id;
        if (targetId == null) {
            throw new IllegalArgumentException("NOC application ID is required");
        }
        return issue(targetId, body, issuedById, approvedById, remarks, auth);
    }

    @RequestMapping(value = "/{id}/reject", method = {RequestMethod.PUT, RequestMethod.POST})
    @PreAuthorize("hasAnyRole('WARD_OFFICER','COMMISSIONER','ADMIN')")
    @Operation(summary = "Reject a NOC application")
    public ResponseEntity<NOCResponseDto> reject(
            @PathVariable Long id,
            @RequestBody(required = false) com.smartmunicipal.propertytax.dto.NOCApprovalRequest body,
            @RequestParam(required = false) Long officerId,
            @RequestParam(required = false) String remarks,
            org.springframework.security.core.Authentication auth) {
        Long offId = null;
        if (body != null) {
            offId = body.getOfficerId() != null ? body.getOfficerId()
                    : (body.getApprovedById() != null ? body.getApprovedById()
                    : body.getIssuedById());
        }
        if (offId == null) {
            offId = officerId != null ? officerId : currentUserId(auth);
        }

        String finalRemarks = null;
        if (body != null && body.getRemarks() != null && !body.getRemarks().isBlank()) {
            finalRemarks = body.getRemarks().trim();
        } else if (remarks != null && !remarks.isBlank()) {
            finalRemarks = remarks.trim();
        } else {
            finalRemarks = "Rejected by municipal authority";
        }

        return ResponseEntity.ok(nocService.rejectNOC(id, offId, finalRemarks));
    }

    @GetMapping("/pending")
    @PreAuthorize("hasAnyRole('WARD_OFFICER','COMMISSIONER','ADMIN')")
    @Operation(summary = "Get all pending NOC requests")
    public ResponseEntity<List<NOCResponseDto>> getPending() {
        return ResponseEntity.ok(nocService.findByStatus("PENDING"));
    }

    @GetMapping("/property/{propertyId}")
    @Operation(summary = "Get all NOC requests for a property")
    public ResponseEntity<List<NOCResponseDto>> getByProperty(@PathVariable Long propertyId, org.springframework.security.core.Authentication auth) {
        if (isOwner(auth)) {
            var prop = propertyService.findById(propertyId);
            if (!prop.getOwnerId().equals(currentUserId(auth))) {
                throw new org.springframework.security.access.AccessDeniedException("Property is outside current user's scope");
            }
        }
        return ResponseEntity.ok(nocService.findByPropertyId(propertyId));
    }

    @GetMapping({"/my", "/my/{userId}"})
    @Operation(summary = "Get NOC requests submitted by a user")
    public ResponseEntity<List<NOCResponseDto>> getByUser(
            @PathVariable(required = false) Long userId,
            org.springframework.security.core.Authentication auth) {
        Long targetId = userId != null ? userId : currentUserId(auth);
        if (isOwner(auth) && !targetId.equals(currentUserId(auth))) {
            throw new org.springframework.security.access.AccessDeniedException("Cannot view other users' NOC requests");
        }
        return ResponseEntity.ok(nocService.findByRequestedById(targetId));
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
