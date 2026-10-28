package com.smartmunicipal.propertytax.repository;

import com.smartmunicipal.propertytax.entity.NOCRequest;
import com.smartmunicipal.propertytax.entity.Property;
import com.smartmunicipal.propertytax.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface NOCRequestRepository extends JpaRepository<NOCRequest, Long> {

    // NOC requests for a property — SRS Appendix H: GET /api/noc/{id}/status
    List<NOCRequest> findByProperty(Property property);

    // NOC requests by property ID — SRS: property-scoped NOC lookup
    List<NOCRequest> findByPropertyId(Long propertyId);

    // NOC requests submitted by a user — SRS FR3: owner sees own requests
    List<NOCRequest> findByRequestedBy(User requestedBy);

    // NOC requests by requester ID — SRS FR3: RBAC owner scope
    List<NOCRequest> findByRequestedById(Long requestedById);

    // Pending NOC requests — SRS Appendix H: PUT /api/noc/{id}/issue (officer workflow)
    List<NOCRequest> findByStatus(String status);

    // Pending NOC requests for a specific property — SRS: NOC issuance workflow
    List<NOCRequest> findByPropertyIdAndStatus(Long propertyId, String status);
}
