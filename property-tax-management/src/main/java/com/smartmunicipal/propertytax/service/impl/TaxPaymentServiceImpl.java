package com.smartmunicipal.propertytax.service.impl;

import com.smartmunicipal.propertytax.dto.TaxPaymentRequest;
import com.smartmunicipal.propertytax.dto.TaxPaymentResponse;
import com.smartmunicipal.propertytax.entity.TaxAssessment;
import com.smartmunicipal.propertytax.entity.TaxPayment;
import com.smartmunicipal.propertytax.entity.User;
import com.smartmunicipal.propertytax.enums.TaxAssessmentStatus;
import com.smartmunicipal.propertytax.exception.ResourceNotFoundException;
import com.smartmunicipal.propertytax.repository.TaxAssessmentRepository;
import com.smartmunicipal.propertytax.repository.TaxPaymentRepository;
import com.smartmunicipal.propertytax.repository.UserRepository;
import com.smartmunicipal.propertytax.service.AuditLogService;
import com.smartmunicipal.propertytax.service.TaxPaymentService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class TaxPaymentServiceImpl implements TaxPaymentService {

    private final TaxPaymentRepository paymentRepository;
    private final TaxAssessmentRepository assessmentRepository;
    private final UserRepository userRepository;
    private final AuditLogService auditLogService;
    private final com.smartmunicipal.propertytax.service.NotificationService notificationService;

    @Override
    @Transactional
    public TaxPaymentResponse initiatePayment(TaxPaymentRequest request) {
        TaxAssessment assessment = assessmentRepository.findById(request.getAssessmentId())
                .orElseThrow(() -> new ResourceNotFoundException("Assessment not found with id: " + request.getAssessmentId()));

        if (assessment.getStatus() == TaxAssessmentStatus.PAID) {
            throw new IllegalStateException("Assessment is already fully paid");
        }

        if (paymentRepository.existsByTransactionId(request.getTransactionId())) {
            throw new IllegalArgumentException("Duplicate transaction ID: " + request.getTransactionId());
        }

        String receiptNo = generateReceiptNo();

        TaxPayment payment = TaxPayment.builder()
                .assessment(assessment)
                .amountPaid(request.getAmountPaid())
                .paymentMode(request.getPaymentMode())
                .transactionId(request.getTransactionId())
                .paidDate(LocalDateTime.now())
                .receiptNo(receiptNo)
                .build();

        paymentRepository.save(payment);

        // Recalculate total paid and update assessment status
        BigDecimal totalPaid = paymentRepository.findByAssessmentId(assessment.getId())
                .stream()
                .map(TaxPayment::getAmountPaid)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        int cmp = totalPaid.compareTo(assessment.getTotalDue());
        if (cmp >= 0) {
            assessment.setStatus(TaxAssessmentStatus.PAID);
        } else {
            assessment.setStatus(TaxAssessmentStatus.PARTIAL);
        }
        assessmentRepository.save(assessment);

        // FR5/FR16: payment logged after successful save + assessment update
        auditLogService.log(resolveCurrentUserId(), "PAYMENT", "TaxPayment", payment.getId(),
                "Payment received: assessmentId=" + assessment.getId()
                + " amount=" + payment.getAmountPaid()
                + " mode=" + payment.getPaymentMode()
                + " receipt=" + receiptNo
                + " assessmentStatus=" + assessment.getStatus(), null);

        // Emit notification to property owner
        try {
            if (assessment.getProperty() != null && assessment.getProperty().getOwner() != null) {
                notificationService.createNotification(
                        assessment.getProperty().getOwner().getId(),
                        "IN_APP",
                        "PAYMENT_SUCCESS",
                        "Payment of ₹" + payment.getAmountPaid() + " received for property "
                                + assessment.getProperty().getPropertyId() + ". Receipt No: " + receiptNo
                );
            }
        } catch (Exception ignored) {}

        return toResponse(payment);
    }

    @Override
    public TaxPaymentResponse findById(Long id) {
        return toResponse(paymentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Payment not found with id: " + id)));
    }

    @Override
    public TaxPaymentResponse findByReceiptNo(String receiptNo) {
        return toResponse(paymentRepository.findByReceiptNo(receiptNo)
                .orElseThrow(() -> new ResourceNotFoundException("Payment not found with receipt: " + receiptNo)));
    }

    @Override
    public List<TaxPaymentResponse> findByAssessmentId(Long assessmentId) {
        return paymentRepository.findByAssessmentId(assessmentId)
                .stream().map(p -> TaxPaymentServiceImpl.toResponse(p)).collect(Collectors.toList());
    }

    private Long resolveCurrentUserId() {
        var auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated()) return null;
        return userRepository.findByEmail(auth.getName()).map(User::getId).orElse(null);
    }

    @Override
    @Transactional(readOnly = true)
    public List<TaxPaymentResponse> findByOwnerId(Long ownerId) {
        return paymentRepository.findByOwnerId(ownerId)
                .stream()
                .map(TaxPaymentServiceImpl::toResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<TaxPaymentResponse> findAll() {
        return paymentRepository.findAll()
                .stream()
                .map(TaxPaymentServiceImpl::toResponse)
                .collect(Collectors.toList());
    }

    private String generateReceiptNo() {
        String timestamp = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMddHHmmss"));
        String unique = UUID.randomUUID().toString().substring(0, 6).toUpperCase();
        return "RCP-" + timestamp + "-" + unique;
    }

    public static TaxPaymentResponse toResponse(TaxPayment p) {
        return new TaxPaymentResponse(
                p.getId(),
                p.getAssessment().getId(),
                p.getAmountPaid(),
                p.getPaymentMode(),
                p.getTransactionId(),
                p.getPaidDate(),
                p.getReceiptNo()
        );
    }
}
