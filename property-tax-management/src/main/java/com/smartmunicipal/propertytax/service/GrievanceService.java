package com.smartmunicipal.propertytax.service;

import com.smartmunicipal.propertytax.dto.GrievanceRequest;
import com.smartmunicipal.propertytax.dto.GrievanceResponse;

import java.util.List;

public interface GrievanceService {
    GrievanceResponse submitGrievance(Long userId, GrievanceRequest request);
    List<GrievanceResponse> getMyGrievances(Long userId);
    List<GrievanceResponse> getAllGrievances();
    GrievanceResponse updateStatus(Long id, String status, String remarks);
}
