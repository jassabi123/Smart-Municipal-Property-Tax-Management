package com.smartmunicipal.propertytax.service;

import com.smartmunicipal.propertytax.dto.NOCRequestDto;
import com.smartmunicipal.propertytax.dto.NOCResponseDto;

import java.util.List;

public interface NOCService {

    NOCResponseDto requestNOC(NOCRequestDto request);

    NOCResponseDto findById(Long id);

    List<NOCResponseDto> findByPropertyId(Long propertyId);

    List<NOCResponseDto> findByRequestedById(Long userId);

    List<NOCResponseDto> findByStatus(String status);

    List<NOCResponseDto> findAll();

    NOCResponseDto issueNOC(Long nocId, Long issuedById, String remarks);

    NOCResponseDto rejectNOC(Long nocId, Long issuedById, String remarks);
}
