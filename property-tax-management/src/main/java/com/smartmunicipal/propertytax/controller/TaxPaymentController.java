package com.smartmunicipal.propertytax.controller;

import com.smartmunicipal.propertytax.dto.TaxPaymentRequest;
import com.smartmunicipal.propertytax.dto.TaxPaymentResponse;
import com.smartmunicipal.propertytax.service.TaxPaymentService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/payments")
@RequiredArgsConstructor
@SecurityRequirement(name = "bearerAuth")
@Tag(name = "Tax Payments", description = "Tax payment processing")
public class TaxPaymentController {

    private final TaxPaymentService paymentService;
    private final com.smartmunicipal.propertytax.service.TaxAssessmentService assessmentService;
    private final com.smartmunicipal.propertytax.service.PropertyService propertyService;
    private final com.smartmunicipal.propertytax.repository.UserRepository userRepository;

    @PostMapping("/initiate")
    @Operation(summary = "Initiate a tax payment — SRS Appendix H: POST /api/payments/initiate")
    public ResponseEntity<TaxPaymentResponse> initiate(@Valid @RequestBody TaxPaymentRequest request, org.springframework.security.core.Authentication auth) {
        if (isOwner(auth)) {
            var assessment = assessmentService.findById(request.getAssessmentId());
            var property = propertyService.findById(assessment.getPropertyId());
            if (!property.getOwnerId().equals(currentUserId(auth))) {
                throw new org.springframework.security.access.AccessDeniedException("Assessment does not belong to the current property owner");
            }
        }
        return ResponseEntity.status(HttpStatus.CREATED).body(paymentService.initiatePayment(request));
    }

    @GetMapping
    @Operation(summary = "List payments (staff sees all, owner sees own)")
    public ResponseEntity<List<TaxPaymentResponse>> getAll(org.springframework.security.core.Authentication auth) {
        if (isOwner(auth)) {
            return ResponseEntity.ok(paymentService.findByOwnerId(currentUserId(auth)));
        }
        return ResponseEntity.ok(paymentService.findAll());
    }

    @GetMapping("/my")
    @Operation(summary = "Get own payment history")
    public ResponseEntity<List<TaxPaymentResponse>> getMyPayments(org.springframework.security.core.Authentication auth) {
        return ResponseEntity.ok(paymentService.findByOwnerId(currentUserId(auth)));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get payment by ID")
    public ResponseEntity<TaxPaymentResponse> getById(@PathVariable Long id, org.springframework.security.core.Authentication auth) {
        TaxPaymentResponse payment = paymentService.findById(id);
        if (isOwner(auth)) {
            var assessment = assessmentService.findById(payment.getAssessmentId());
            var property = propertyService.findById(assessment.getPropertyId());
            if (!property.getOwnerId().equals(currentUserId(auth))) {
                throw new org.springframework.security.access.AccessDeniedException("Payment record is outside current user scope");
            }
        }
        return ResponseEntity.ok(payment);
    }

    @GetMapping("/receipt/{receiptNo}")
    @Operation(summary = "Get payment by receipt number — SRS Appendix H: GET /api/payments/receipt/{id}")
    public ResponseEntity<TaxPaymentResponse> getByReceipt(@PathVariable String receiptNo, org.springframework.security.core.Authentication auth) {
        TaxPaymentResponse payment = paymentService.findByReceiptNo(receiptNo);
        if (isOwner(auth)) {
            var assessment = assessmentService.findById(payment.getAssessmentId());
            var property = propertyService.findById(assessment.getPropertyId());
            if (!property.getOwnerId().equals(currentUserId(auth))) {
                throw new org.springframework.security.access.AccessDeniedException("Payment receipt is outside current user scope");
            }
        }
        return ResponseEntity.ok(payment);
    }

    @GetMapping("/assessment/{assessmentId}")
    @Operation(summary = "Get all payments for an assessment")
    public ResponseEntity<List<TaxPaymentResponse>> getByAssessment(@PathVariable Long assessmentId, org.springframework.security.core.Authentication auth) {
        if (isOwner(auth)) {
            var assessment = assessmentService.findById(assessmentId);
            var property = propertyService.findById(assessment.getPropertyId());
            if (!property.getOwnerId().equals(currentUserId(auth))) {
                throw new org.springframework.security.access.AccessDeniedException("Assessment payments are outside current user scope");
            }
        }
        return ResponseEntity.ok(paymentService.findByAssessmentId(assessmentId));
    }

    private boolean isOwner(org.springframework.security.core.Authentication authentication) {
        return authentication != null && authentication.getAuthorities().stream()
                .anyMatch(a -> "ROLE_PROPERTY_OWNER".equals(a.getAuthority()));
    }

    private Long currentUserId(org.springframework.security.core.Authentication authentication) {
        return userRepository.findByEmail(authentication.getName())
                .map(com.smartmunicipal.propertytax.entity.User::getId)
                .orElseThrow(() -> new org.springframework.security.access.AccessDeniedException("Authenticated user not found"));
    }
}
