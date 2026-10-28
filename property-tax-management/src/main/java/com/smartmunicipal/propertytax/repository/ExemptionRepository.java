package com.smartmunicipal.propertytax.repository;

import com.smartmunicipal.propertytax.entity.Exemption;
import com.smartmunicipal.propertytax.entity.Property;
import com.smartmunicipal.propertytax.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface ExemptionRepository extends JpaRepository<Exemption, Long> {

    // All exemptions for a property — SRS: exemption management per property
    List<Exemption> findByProperty(Property property);

    // All exemptions by property ID — SRS: exemption lookup by property ID
    List<Exemption> findByPropertyId(Long propertyId);

    // Exemptions approved by a specific officer — SRS FR3: RBAC scope for approvers
    List<Exemption> findByApprovedBy(User approvedBy);

    // Exemptions approved by officer ID — SRS FR3: officer-scoped access
    List<Exemption> findByApprovedById(Long approvedById);

    // Active exemptions on a given date — SRS: validity window check
    List<Exemption> findByPropertyIdAndValidFromLessThanEqualAndValidToGreaterThanEqual(
            Long propertyId, LocalDate from, LocalDate to);

    // Exemptions by type — SRS Section 1.2: senior citizens, charities etc.
    List<Exemption> findByExemptionType(String exemptionType);

    /**
     * Overlap detection query: returns exemptions for the same property + category
     * whose validity window overlaps with [newFrom, newTo].
     *
     * Two date ranges [A, B] and [C, D] overlap when A <= D AND C <= B.
     * Optionally excludes a specific exemption record by ID (for update validation).
     */
    @org.springframework.data.jpa.repository.Query("""
            SELECT e FROM Exemption e
            WHERE e.property.id = :propertyId
              AND UPPER(e.exemptionType) = UPPER(:exemptionType)
              AND e.validFrom <= :newTo
              AND e.validTo   >= :newFrom
              AND (:excludeId IS NULL OR e.id <> :excludeId)
            """)
    List<Exemption> findOverlapping(
            Long propertyId,
            String exemptionType,
            LocalDate newFrom,
            LocalDate newTo,
            Long excludeId);
}
