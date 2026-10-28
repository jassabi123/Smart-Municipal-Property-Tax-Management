package com.smartmunicipal.propertytax.service;

import com.smartmunicipal.propertytax.dto.TaxAssessmentRequest;
import com.smartmunicipal.propertytax.dto.TaxAssessmentResponse;
import com.smartmunicipal.propertytax.enums.TaxAssessmentStatus;

import java.util.List;

public interface TaxAssessmentService {

    TaxAssessmentResponse createAssessment(TaxAssessmentRequest request);

    TaxAssessmentResponse findById(Long id);

    List<TaxAssessmentResponse> findByPropertyId(Long propertyId);

    List<TaxAssessmentResponse> findByStatus(TaxAssessmentStatus status);

    List<TaxAssessmentResponse> findByFinancialYear(String financialYear);

    List<TaxAssessmentResponse> findDefaulters();

    TaxAssessmentResponse updateAssessment(Long id, TaxAssessmentRequest request);

    List<TaxAssessmentResponse> findByOwnerId(Long ownerId);

    List<TaxAssessmentResponse> findAll();

    TaxAssessmentResponse applyPenalty(Long id, java.math.BigDecimal penalty);

    void deleteAssessment(Long id);
}
