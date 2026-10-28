package com.smartmunicipal.propertytax.dto;

import com.smartmunicipal.propertytax.enums.PaymentMode;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class TaxPaymentResponse {

    private Long id;
    private Long assessmentId;
    private BigDecimal amountPaid;
    private PaymentMode paymentMode;
    private String transactionId;
    private LocalDateTime paidDate;
    private String receiptNo;
}
