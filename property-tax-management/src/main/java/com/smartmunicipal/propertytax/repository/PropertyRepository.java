package com.smartmunicipal.propertytax.repository;

import com.smartmunicipal.propertytax.entity.Property;
import com.smartmunicipal.propertytax.entity.User;
import com.smartmunicipal.propertytax.enums.ConstructionType;
import com.smartmunicipal.propertytax.enums.PropertyStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface PropertyRepository extends JpaRepository<Property, Long> {

    // Unique property lookup — SRS FR4: duplicate detection on propertyId
    Optional<Property> findByPropertyId(String propertyId);

    // Duplicate guard — SRS FR4: prevent duplicate unique identifier creation
    boolean existsByPropertyId(String propertyId);

    // Owner's properties — SRS FR3: property owners access only own records
    List<Property> findByOwner(User owner);

    // Owner's properties by ID — SRS FR3: RBAC scope by owner ID
    List<Property> findByOwnerId(Long ownerId);

    // Ward-level search — SRS FR4: search and filter by ward
    List<Property> findByWardNo(String wardNo);

    // Status filter — SRS FR4: status distribution analytics
    List<Property> findByStatus(PropertyStatus status);

    // Construction type filter — SRS FR4: search by multiple criteria
    List<Property> findByConstructionType(ConstructionType constructionType);

    // Ward + status combined — SRS FR4: multi-criteria search
    List<Property> findByWardNoAndStatus(String wardNo, PropertyStatus status);
}
