package com.smartmunicipal.propertytax.dto;

import com.smartmunicipal.propertytax.enums.ConstructionType;
import com.smartmunicipal.propertytax.enums.PropertyStatus;
import lombok.*;

import java.math.BigDecimal;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class PropertyResponse {

    private Long id;
    private String propertyId;
    private Long ownerId;
    private String ownerName;
    private String address;
    private String wardNo;
    private BigDecimal areaSqft;
    private ConstructionType constructionType;
    private BigDecimal assessedValue;
    private BigDecimal lat;
    private BigDecimal lng;
    private PropertyStatus status;
}
