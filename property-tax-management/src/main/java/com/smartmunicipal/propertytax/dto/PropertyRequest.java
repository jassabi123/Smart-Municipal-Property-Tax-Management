package com.smartmunicipal.propertytax.dto;

import com.smartmunicipal.propertytax.enums.ConstructionType;
import com.smartmunicipal.propertytax.enums.PropertyStatus;
import jakarta.validation.constraints.*;
import lombok.*;

import java.math.BigDecimal;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class PropertyRequest {

    @NotBlank(message = "Property ID is required")
    private String propertyId;

    @NotNull(message = "Owner ID is required")
    private Long ownerId;

    @NotBlank(message = "Address is required")
    private String address;

    @NotBlank(message = "Ward number is required")
    private String wardNo;

    @NotNull(message = "Area is required")
    @Positive(message = "Area must be a positive number")
    private BigDecimal areaSqft;

    @NotNull(message = "Construction type is required")
    private ConstructionType constructionType;

    @PositiveOrZero(message = "Assessed value must be non-negative")
    private BigDecimal assessedValue;

    @DecimalMin(value = "-90.000000", message = "Latitude must be between -90 and 90")
    @DecimalMax(value = "90.000000", message = "Latitude must be between -90 and 90")
    private BigDecimal lat;

    @DecimalMin(value = "-180.000000", message = "Longitude must be between -180 and 180")
    @DecimalMax(value = "180.000000", message = "Longitude must be between -180 and 180")
    private BigDecimal lng;

    private PropertyStatus status;
}
