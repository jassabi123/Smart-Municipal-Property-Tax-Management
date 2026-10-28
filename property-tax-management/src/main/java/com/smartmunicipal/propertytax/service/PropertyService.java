package com.smartmunicipal.propertytax.service;

import com.smartmunicipal.propertytax.dto.PropertyRequest;
import com.smartmunicipal.propertytax.dto.PropertyResponse;
import com.smartmunicipal.propertytax.enums.ConstructionType;
import com.smartmunicipal.propertytax.enums.PropertyStatus;

import java.util.List;

public interface PropertyService {

    PropertyResponse createProperty(PropertyRequest request);

    PropertyResponse findById(Long id);

    PropertyResponse findByPropertyId(String propertyId);

    List<PropertyResponse> findAll();

    List<PropertyResponse> findByOwnerId(Long ownerId);

    List<PropertyResponse> findByWardNo(String wardNo);

    List<PropertyResponse> findByStatus(PropertyStatus status);

    List<PropertyResponse> findByConstructionType(ConstructionType constructionType);

    PropertyResponse updateProperty(Long id, PropertyRequest request);

    PropertyResponse verifyProperty(Long id);

    PropertyResponse updateStatus(Long id, PropertyStatus status);

    void deleteProperty(Long id);
}
