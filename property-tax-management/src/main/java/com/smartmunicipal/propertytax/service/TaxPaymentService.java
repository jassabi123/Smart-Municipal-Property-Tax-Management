package com.smartmunicipal.propertytax.service;

import com.smartmunicipal.propertytax.dto.TaxPaymentRequest;
import com.smartmunicipal.propertytax.dto.TaxPaymentResponse;

import java.util.List;

public interface TaxPaymentService {

    TaxPaymentResponse initiatePayment(TaxPaymentRequest request);

    TaxPaymentResponse findById(Long id);

    TaxPaymentResponse findByReceiptNo(String receiptNo);

    List<TaxPaymentResponse> findByAssessmentId(Long assessmentId);

    List<TaxPaymentResponse> findByOwnerId(Long ownerId);

    List<TaxPaymentResponse> findAll();
}
