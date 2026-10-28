package com.smartmunicipal.propertytax.service;

import com.smartmunicipal.propertytax.dto.ExemptionRequest;
import com.smartmunicipal.propertytax.dto.ExemptionResponse;

import java.util.List;

public interface ExemptionService {

    ExemptionResponse createExemption(ExemptionRequest request);

    List<ExemptionResponse> findAll();

    ExemptionResponse findById(Long id);

    List<ExemptionResponse> findByPropertyId(Long propertyId);

    ExemptionResponse updateExemption(Long id, ExemptionRequest request);

    void deleteExemption(Long id);
}
