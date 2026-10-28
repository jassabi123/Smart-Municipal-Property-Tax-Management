package com.smartmunicipal.propertytax.repository;

import com.smartmunicipal.propertytax.entity.TaxAssessment;
import com.smartmunicipal.propertytax.entity.TaxPayment;
import com.smartmunicipal.propertytax.enums.PaymentMode;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface TaxPaymentRepository extends JpaRepository<TaxPayment, Long> {

    // Payment history for an assessment — SRS: payment lookup per assessment
    List<TaxPayment> findByAssessment(TaxAssessment assessment);

    // Payment history by assessment ID — SRS Appendix H: GET /api/payments/receipt/{id}
    List<TaxPayment> findByAssessmentId(Long assessmentId);

    // Transaction deduplication — SRS FR4: duplicate detection on transactionId
    Optional<TaxPayment> findByTransactionId(String transactionId);

    // Transaction existence check — SRS FR4: prevent duplicate transaction
    boolean existsByTransactionId(String transactionId);

    // Receipt lookup — SRS Appendix H: GET /api/payments/receipt/{id}
    Optional<TaxPayment> findByReceiptNo(String receiptNo);

    // Receipt existence check — SRS FR4: unique receipt enforcement
    boolean existsByReceiptNo(String receiptNo);

    // Payment mode analytics — SRS FR9: collection analytics by payment mode
    List<TaxPayment> findByPaymentMode(PaymentMode paymentMode);

    // Date range for collection analytics — SRS FR9
    List<TaxPayment> findByPaidDateBetween(
            LocalDateTime from,
            LocalDateTime to
    );

    // Analytics — calculate total collected amount directly in database
    @Query("""
            SELECT COALESCE(SUM(p.amountPaid), 0)
            FROM TaxPayment p
            """)
    BigDecimal sumAmountPaid();

    @Query("SELECT p FROM TaxPayment p WHERE p.assessment.property.owner.id = :ownerId ORDER BY p.paidDate DESC")
    List<TaxPayment> findByOwnerId(Long ownerId);
}