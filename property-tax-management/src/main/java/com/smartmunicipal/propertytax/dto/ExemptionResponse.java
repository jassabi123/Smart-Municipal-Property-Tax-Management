package com.smartmunicipal.propertytax.dto;

import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class ExemptionResponse {

    private Long id;
    private Long propertyId;
    private String propertyIdentifier;
    private String exemptionType;
    private BigDecimal percentage;
    private LocalDate validFrom;
    private LocalDate validTo;
    private Long approvedById;
    private String approvedByName;
}
