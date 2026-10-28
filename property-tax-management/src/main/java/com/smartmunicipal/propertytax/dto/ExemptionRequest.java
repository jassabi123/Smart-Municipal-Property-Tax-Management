package com.smartmunicipal.propertytax.dto;

import jakarta.validation.constraints.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class ExemptionRequest {

    @NotNull(message = "Property ID is required")
    private Long propertyId;

    @NotBlank(message = "Exemption type is required")
    private String exemptionType;

    @NotNull(message = "Percentage is required")
    @DecimalMin(value = "0.0", inclusive = true, message = "Percentage must be at least 0")
    @DecimalMax(value = "100.0", inclusive = true, message = "Percentage must not exceed 100")
    private BigDecimal percentage;

    @NotNull(message = "Valid from date is required")
    private LocalDate validFrom;

    @NotNull(message = "Valid to date is required")
    private LocalDate validTo;

    @NotNull(message = "Approved by (user ID) is required")
    private Long approvedById;
}
