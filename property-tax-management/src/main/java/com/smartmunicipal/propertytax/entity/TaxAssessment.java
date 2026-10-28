package com.smartmunicipal.propertytax.entity;

import com.smartmunicipal.propertytax.enums.TaxAssessmentStatus;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "tax_assessments")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TaxAssessment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "property_id", nullable = false)
    private Property property;

    @Column(name = "financial_year", nullable = false, length = 9)
    private String financialYear;

    @Column(name = "tax_amount", nullable = false, precision = 15, scale = 2)
    private BigDecimal taxAmount;

    @Column(precision = 15, scale = 2)
    @Builder.Default
    private BigDecimal penalty = BigDecimal.ZERO;

    @Column(name = "total_due", nullable = false, precision = 15, scale = 2)
    private BigDecimal totalDue;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private TaxAssessmentStatus status = TaxAssessmentStatus.PENDING;

    @Column(name = "due_date")
    private LocalDate dueDate;

    @OneToMany(mappedBy = "assessment", fetch = FetchType.LAZY, cascade = CascadeType.PERSIST)
    @Builder.Default
    private List<TaxPayment> taxPayments = new ArrayList<>();
}
