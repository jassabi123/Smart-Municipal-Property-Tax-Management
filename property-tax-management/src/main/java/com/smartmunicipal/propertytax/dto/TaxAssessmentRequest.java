package com.smartmunicipal.propertytax.dto;

import com.smartmunicipal.propertytax.enums.TaxAssessmentStatus;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class TaxAssessmentRequest {

    @NotNull(message = "Property ID is required")
    private Long propertyId;

    @NotBlank(message = "Financial year is required")
    @Pattern(
            regexp = "^\\d{4}-\\d{2}$",
            message = "Financial year must be in format YYYY-YY (e.g. 2024-25)"
    )
    private String financialYear;

    @NotNull(message = "Tax amount is required")
    @DecimalMin(
            value = "0.0",
            inclusive = true,
            message = "Tax amount must be non-negative"
    )
    private BigDecimal taxAmount;

    @DecimalMin(
            value = "0.0",
            inclusive = true,
            message = "Penalty must be non-negative"
    )
    private BigDecimal penalty;

    // Calculated by the service from taxAmount + penalty
    private BigDecimal totalDue;

    private TaxAssessmentStatus status;

    private LocalDate dueDate;
}