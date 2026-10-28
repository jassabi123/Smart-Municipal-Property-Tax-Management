package com.smartmunicipal.propertytax.controller;

import com.smartmunicipal.propertytax.dto.NoticeRequest;
import com.smartmunicipal.propertytax.dto.NoticeResponse;
import com.smartmunicipal.propertytax.repository.UserRepository;
import com.smartmunicipal.propertytax.service.NoticeService;
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
@RequestMapping("/api/notices")
@RequiredArgsConstructor
@SecurityRequirement(name = "bearerAuth")
@Tag(name = "Notices", description = "Arrear and recovery notice management")
public class NoticeController {

    private final NoticeService noticeService;
    private final UserRepository userRepository;

    @PostMapping("/generate")
    @PreAuthorize("hasAnyRole('WARD_OFFICER','TAX_ASSESSOR','ADMIN','COMMISSIONER')")
    @Operation(summary = "Generate a notice — SRS Appendix H: POST /api/notices/generate")
    public ResponseEntity<NoticeResponse> generate(
            @Valid @RequestBody NoticeRequest request,
            Authentication auth) {
        if (request.getIssuedById() == null) {
            Long officerId = currentUserId(auth);
            if (officerId == null) {
                throw new AccessDeniedException("Authenticated user could not be resolved to issue notice");
            }
            request.setIssuedById(officerId);
        }
        return ResponseEntity.status(HttpStatus.CREATED).body(noticeService.generateNotice(request));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get notice by ID")
    public ResponseEntity<NoticeResponse> getById(@PathVariable Long id) {
        return ResponseEntity.ok(noticeService.findById(id));
    }

    @GetMapping
    @Operation(summary = "List notices with optional filters")
    public ResponseEntity<List<NoticeResponse>> getAll(
            @RequestParam(required = false) Long propertyId,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String noticeType) {

        if (propertyId != null)  return ResponseEntity.ok(noticeService.findByPropertyId(propertyId));
        if (status != null)      return ResponseEntity.ok(noticeService.findByStatus(status));
        if (noticeType != null)  return ResponseEntity.ok(noticeService.findByNoticeType(noticeType));
        return ResponseEntity.ok(noticeService.findAll());
    }

    @PutMapping("/{id}/status")
    @PreAuthorize("hasAnyRole('WARD_OFFICER','TAX_ASSESSOR','ADMIN','COMMISSIONER')")
    @Operation(summary = "Update notice status")
    public ResponseEntity<NoticeResponse> updateStatus(@PathVariable Long id,
                                                       @RequestParam String status) {
        return ResponseEntity.ok(noticeService.updateStatus(id, status));
    }

    private Long currentUserId(Authentication authentication) {
        if (authentication == null || !authentication.isAuthenticated()) {
            return null;
        }
        return userRepository.findByEmail(authentication.getName())
                .map(com.smartmunicipal.propertytax.entity.User::getId)
                .orElse(null);
    }
}
