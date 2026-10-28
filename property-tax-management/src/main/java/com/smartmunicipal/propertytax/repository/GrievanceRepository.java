package com.smartmunicipal.propertytax.repository;

import com.smartmunicipal.propertytax.entity.Grievance;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface GrievanceRepository extends JpaRepository<Grievance, Long> {
    List<Grievance> findByUserIdOrderByCreatedAtDesc(Long userId);
    List<Grievance> findByPropertyId(Long propertyId);
    List<Grievance> findByStatus(String status);
    long countByStatus(String status);
}
