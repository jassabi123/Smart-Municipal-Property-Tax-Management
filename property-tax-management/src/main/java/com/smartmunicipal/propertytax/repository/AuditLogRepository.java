package com.smartmunicipal.propertytax.repository;

import com.smartmunicipal.propertytax.entity.AuditLog;
import com.smartmunicipal.propertytax.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface AuditLogRepository extends JpaRepository<AuditLog, Long> {

    // Audit trail by user — SRS FR16: searchable audit trail per user
    List<AuditLog> findByPerformedByOrderByPerformedAtDesc(User performedBy);

    // Audit trail by user ID — SRS FR16: user activity history
    List<AuditLog> findByPerformedByIdOrderByPerformedAtDesc(Long userId);

    // Audit trail by action type — SRS FR16: filter by CREATE/UPDATE/DELETE/LOGIN
    List<AuditLog> findByAction(String action);

    // Audit trail by entity type — SRS FR16: filter by affected entity (Property, User etc.)
    List<AuditLog> findByEntityType(String entityType);

    // Audit trail for a specific record — SRS FR16: full history of a single record
    List<AuditLog> findByEntityTypeAndEntityIdOrderByPerformedAtDesc(String entityType, Long entityId);

    // Audit trail within a date range — SRS FR16: compliance audit packages
    List<AuditLog> findByPerformedAtBetweenOrderByPerformedAtDesc(LocalDateTime from, LocalDateTime to);

    // Audit trail by IP address — SRS FR1: security logging by IP
    List<AuditLog> findByIpAddress(String ipAddress);

    // Combined user + action filter — SRS FR16: targeted audit search
    List<AuditLog> findByPerformedByIdAndAction(Long userId, String action);

    // Recent audit logs for admin dashboard
    List<AuditLog> findTop20ByOrderByPerformedAtDesc();
}
