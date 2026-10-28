package com.smartmunicipal.propertytax.entity;

import com.smartmunicipal.propertytax.enums.PaymentMode;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "tax_payments")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TaxPayment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "assessment_id", nullable = false)
    private TaxAssessment assessment;

    @Column(name = "amount_paid", nullable = false, precision = 15, scale = 2)
    private BigDecimal amountPaid;

    @Enumerated(EnumType.STRING)
    @Column(name = "payment_mode", nullable = false)
    private PaymentMode paymentMode;

    @Column(name = "transaction_id", unique = true)
    private String transactionId;

    @Column(name = "paid_date")
    private LocalDateTime paidDate;

    @Column(name = "receipt_no", unique = true)
    private String receiptNo;
}
