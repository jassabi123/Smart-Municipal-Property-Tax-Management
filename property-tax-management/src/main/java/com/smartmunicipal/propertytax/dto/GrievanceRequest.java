package com.smartmunicipal.propertytax.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class GrievanceRequest {
    private Long propertyId;
    @NotBlank(message = "Subject is required")
    private String subject;
    @NotBlank(message = "Description is required")
    private String description;
}
