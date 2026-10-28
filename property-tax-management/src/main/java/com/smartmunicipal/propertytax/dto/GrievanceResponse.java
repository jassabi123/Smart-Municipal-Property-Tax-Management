package com.smartmunicipal.propertytax.dto;

import lombok.*;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class GrievanceResponse {
    private Long id;
    private Long userId;
    private String userName;
    private Long propertyId;
    private String propertyCustomId;
    private String subject;
    private String description;
    private String status;
    private String resolutionRemarks;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
