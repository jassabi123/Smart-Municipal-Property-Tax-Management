package com.smartmunicipal.propertytax.controller;

import com.smartmunicipal.propertytax.dto.AuditLogResponse;
import com.smartmunicipal.propertytax.service.AuditLogService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/audit")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
@SecurityRequirement(name = "bearerAuth")
@Tag(name = "Audit Logs", description = "Tamper-evident audit trail — ADMIN only")
public class AuditLogController {

    private final AuditLogService auditLogService;

    @GetMapping("/user/{userId}")
    @Operation(summary = "Get audit trail for a user")
    public ResponseEntity<List<AuditLogResponse>> getByUser(@PathVariable Long userId) {
        return ResponseEntity.ok(auditLogService.findByUserId(userId));
    }

    @GetMapping("/entity/{entityType}/{entityId}")
    @Operation(summary = "Get audit trail for a specific record")
    public ResponseEntity<List<AuditLogResponse>> getByEntity(@PathVariable String entityType,
                                                               @PathVariable Long entityId) {
        return ResponseEntity.ok(auditLogService.findByEntityTypeAndEntityId(entityType, entityId));
    }

    @GetMapping("/action/{action}")
    @Operation(summary = "Get audit logs by action type (CREATE, UPDATE, DELETE, LOGIN)")
    public ResponseEntity<List<AuditLogResponse>> getByAction(@PathVariable String action) {
        return ResponseEntity.ok(auditLogService.findByAction(action));
    }

    @GetMapping("/recent")
    @Operation(summary = "Get recent audit logs (ADMIN only)")
    public ResponseEntity<List<AuditLogResponse>> getRecent() {
        return ResponseEntity.ok(auditLogService.findRecent());
    }

    @GetMapping("/all")
    @Operation(summary = "Get all recent audit logs in the municipal ledger")
    public ResponseEntity<List<AuditLogResponse>> getAll() {
        return ResponseEntity.ok(auditLogService.findRecent());
    }
}
