package com.smartmunicipal.propertytax.repository;

import com.smartmunicipal.propertytax.entity.Property;
import com.smartmunicipal.propertytax.entity.TaxAssessment;
import com.smartmunicipal.propertytax.enums.TaxAssessmentStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface TaxAssessmentRepository extends JpaRepository<TaxAssessment, Long> {

    // All assessments for a property — SRS: GET /api/properties/{id}/assessment
    List<TaxAssessment> findByProperty(Property property);

    // All assessments for a property by ID — SRS FR4: property tax lookup
    List<TaxAssessment> findByPropertyId(Long propertyId);

    // Lookup by financial year — SRS FR9: analytics by year
    List<TaxAssessment> findByFinancialYear(String financialYear);

    // Status-based queries — SRS FR9: pending/paid/defaulted analytics
    List<TaxAssessment> findByStatus(TaxAssessmentStatus status);

    // Specific assessment for a property in a given year — SRS: duplicate assessment guard
    Optional<TaxAssessment> findByPropertyAndFinancialYear(
            Property property,
            String financialYear
    );

    // Same by property ID — SRS: assessment lookup by property ID + year
    Optional<TaxAssessment> findByPropertyIdAndFinancialYear(
            Long propertyId,
            String financialYear
    );

    // Defaulters list — SRS Appendix H: GET /api/defaulters/list
    List<TaxAssessment> findByPropertyIdAndStatus(
            Long propertyId,
            TaxAssessmentStatus status
    );

    // Overdue assessments — SRS FR1: arrear tracking
    List<TaxAssessment> findByStatusAndDueDateBefore(
            TaxAssessmentStatus status,
            LocalDate date
    );

    // Analytics — calculate total assessed amount directly in database
    @Query("""
            SELECT COALESCE(SUM(a.totalDue), 0)
            FROM TaxAssessment a
            """)
    BigDecimal sumTotalDue();

    // Analytics — count defaulted assessments directly in database
    long countByStatus(TaxAssessmentStatus status);

    @Query("SELECT a FROM TaxAssessment a WHERE a.property.owner.id = :ownerId")
    List<TaxAssessment> findByOwnerId(Long ownerId);

    @Query("SELECT a FROM TaxAssessment a LEFT JOIN FETCH a.property p LEFT JOIN FETCH p.owner")
    List<TaxAssessment> findAllWithProperty();

    @Query("SELECT a FROM TaxAssessment a LEFT JOIN FETCH a.property p LEFT JOIN FETCH p.owner WHERE a.status = :status")
    List<TaxAssessment> findByStatusWithProperty(TaxAssessmentStatus status);

    @Query("SELECT a FROM TaxAssessment a LEFT JOIN FETCH a.property p LEFT JOIN FETCH p.owner WHERE a.financialYear = :financialYear")
    List<TaxAssessment> findByFinancialYearWithProperty(String financialYear);

    @Query("SELECT a FROM TaxAssessment a LEFT JOIN FETCH a.property p LEFT JOIN FETCH p.owner WHERE a.property.owner.id = :ownerId")
    List<TaxAssessment> findByOwnerIdWithProperty(Long ownerId);

    @Query("SELECT a FROM TaxAssessment a LEFT JOIN FETCH a.property p LEFT JOIN FETCH p.owner WHERE a.id = :id")
    Optional<TaxAssessment> findByIdWithProperty(Long id);
}