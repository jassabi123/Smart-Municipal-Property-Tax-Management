package com.smartmunicipal.propertytax.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "audit_logs")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AuditLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // The user who performed the action (nullable for system-generated events)
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "performed_by")
    private User performedBy;

    // e.g. CREATE, UPDATE, DELETE, LOGIN, LOGOUT, ACCESS
    @Column(nullable = false, length = 50)
    private String action;

    // e.g. User, Property, TaxAssessment, TaxPayment, Exemption
    @Column(name = "entity_type", nullable = false, length = 100)
    private String entityType;

    // The primary key of the affected record
    @Column(name = "entity_id")
    private Long entityId;

    // Human-readable description of what changed — per SRS FR16 audit trail
    @Column(columnDefinition = "TEXT")
    private String description;

    // IP address — per SRS FR1 "security logging records every event with IP address"
    @Column(name = "ip_address", length = 45)
    private String ipAddress;

    @Column(name = "performed_at", updatable = false, nullable = false)
    private LocalDateTime performedAt;

    @PrePersist
    protected void onCreate() {
        if (performedAt == null) {
            performedAt = LocalDateTime.now();
        }
    }
}
