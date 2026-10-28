package com.smartmunicipal.propertytax.controller;

import com.smartmunicipal.propertytax.dto.GrievanceRequest;
import com.smartmunicipal.propertytax.dto.GrievanceResponse;
import com.smartmunicipal.propertytax.entity.User;
import com.smartmunicipal.propertytax.repository.UserRepository;
import com.smartmunicipal.propertytax.service.GrievanceService;
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
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/grievances")
@RequiredArgsConstructor
@SecurityRequirement(name = "bearerAuth")
@Tag(name = "Grievances", description = "Citizen grievance redressal workflow")
public class GrievanceController {

    private final GrievanceService grievanceService;
    private final UserRepository userRepository;

    @PostMapping
    @Operation(summary = "Submit a new citizen grievance")
    public ResponseEntity<GrievanceResponse> submit(@Valid @RequestBody GrievanceRequest request, Authentication auth) {
        Long userId = currentUserId(auth);
        return ResponseEntity.status(HttpStatus.CREATED).body(grievanceService.submitGrievance(userId, request));
    }

    @GetMapping({"/my", "/my/{userId}"})
    @Operation(summary = "List own submitted grievances")
    public ResponseEntity<List<GrievanceResponse>> getMyGrievances(
            @PathVariable(required = false) Long userId,
            Authentication auth) {
        Long targetId = userId != null ? userId : currentUserId(auth);
        return ResponseEntity.ok(grievanceService.getMyGrievances(targetId));
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN','COMMISSIONER')")
    @Operation(summary = "List all municipal grievances (Admin/Commissioner)")
    public ResponseEntity<List<GrievanceResponse>> getAll() {
        return ResponseEntity.ok(grievanceService.getAllGrievances());
    }

    @PutMapping("/{id}/status")
    @PreAuthorize("hasAnyRole('ADMIN','COMMISSIONER')")
    @Operation(summary = "Update grievance status and resolution remarks")
    public ResponseEntity<GrievanceResponse> updateStatus(
            @PathVariable Long id,
            @RequestParam String status,
            @RequestParam(required = false) String remarks) {
        return ResponseEntity.ok(grievanceService.updateStatus(id, status, remarks));
    }

    @PutMapping("/{id}/resolve")
    @PreAuthorize("hasAnyRole('ADMIN','COMMISSIONER')")
    @Operation(summary = "Resolve a citizen grievance")
    public ResponseEntity<GrievanceResponse> resolve(
            @PathVariable Long id,
            @RequestParam(required = false) String remarks,
            @RequestParam(required = false) String resolutionRemarks,
            @RequestParam(required = false) Long resolvedById) {
        String finalRemarks = remarks != null ? remarks : (resolutionRemarks != null ? resolutionRemarks : "Resolved after municipal review");
        return ResponseEntity.ok(grievanceService.updateStatus(id, "RESOLVED", finalRemarks));
    }

    private Long currentUserId(Authentication authentication) {
        return userRepository.findByEmail(authentication.getName()).map(User::getId)
                .orElseThrow(() -> new AccessDeniedException("Authenticated user not found"));
    }
}
