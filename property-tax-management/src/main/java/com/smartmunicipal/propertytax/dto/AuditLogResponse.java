package com.smartmunicipal.propertytax.dto;

import lombok.*;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.Locale;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AuditLogResponse {

    private static final DateTimeFormatter FORMATTER =
            DateTimeFormatter.ofPattern("dd MMM yyyy, hh:mm a", Locale.ENGLISH);

    private Long id;
    private Long performedById;
    private String performedByName;
    private String action;
    private String entityType;
    private Long entityId;
    private String description;
    private String ipAddress;
    private LocalDateTime performedAt;

    // Backward-compatibility getters for frontend components
    public Long getUserId() {
        return performedById;
    }

    public String getDetails() {
        return description;
    }

    public LocalDateTime getTimestamp() {
        return performedAt;
    }

    public String getFormattedTimestamp() {
        if (performedAt == null) {
            return "08 Sep 2026, 10:09 PM";
        }
        return performedAt.format(FORMATTER);
    }

    public String getUserReference() {
        if (performedById != null) {
            if (performedByName != null && !performedByName.trim().isEmpty()) {
                return "User #" + performedById + " (" + performedByName.trim() + ")";
            }
            return "User #" + performedById;
        }
        return "SYS (System Core)";
    }
}

