package com.smartmunicipal.propertytax.service;

import com.smartmunicipal.propertytax.dto.AuditLogResponse;

import java.util.List;

public interface AuditLogService {

    void log(Long performedById, String action, String entityType, Long entityId, String description, String ipAddress);

    List<AuditLogResponse> findByUserId(Long userId);

    List<AuditLogResponse> findByEntityTypeAndEntityId(String entityType, Long entityId);

    List<AuditLogResponse> findByAction(String action);

    List<AuditLogResponse> findRecent();
}
