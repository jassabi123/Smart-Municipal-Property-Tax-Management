package com.smartmunicipal.propertytax.dto;

import com.smartmunicipal.propertytax.enums.PaymentMode;
import jakarta.validation.constraints.*;
import lombok.*;

import java.math.BigDecimal;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class TaxPaymentRequest {

    @NotNull(message = "Assessment ID is required")
    private Long assessmentId;

    @NotNull(message = "Amount paid is required")
    @DecimalMin(value = "0.01", message = "Amount paid must be greater than zero")
    private BigDecimal amountPaid;

    @NotNull(message = "Payment mode is required")
    private PaymentMode paymentMode;

    @NotBlank(message = "Transaction ID is required")
    private String transactionId;
}
