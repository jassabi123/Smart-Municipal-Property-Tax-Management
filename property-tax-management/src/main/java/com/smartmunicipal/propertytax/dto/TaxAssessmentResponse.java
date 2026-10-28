package com.smartmunicipal.propertytax.dto;

import com.smartmunicipal.propertytax.enums.TaxAssessmentStatus;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TaxAssessmentResponse {

    private Long id;
    private Long propertyId;
    private String propertyIdentifier;
    private String financialYear;
    private BigDecimal taxAmount;
    private BigDecimal penalty;
    private BigDecimal totalDue;
    private TaxAssessmentStatus status;
    private LocalDate dueDate;
    private String wardNo;
    private String ward;
    private String ownerName;

    public TaxAssessmentResponse(Long id, Long propertyId, String propertyIdentifier,
                                 String financialYear, BigDecimal taxAmount, BigDecimal penalty,
                                 BigDecimal totalDue, TaxAssessmentStatus status, LocalDate dueDate) {
        this.id = id;
        this.propertyId = propertyId;
        this.propertyIdentifier = propertyIdentifier;
        this.financialYear = financialYear;
        this.taxAmount = taxAmount;
        this.penalty = penalty;
        this.totalDue = totalDue;
        this.status = status;
        this.dueDate = dueDate;
    }

    public String getWard() {
        return ward != null ? ward : wardNo;
    }
}

