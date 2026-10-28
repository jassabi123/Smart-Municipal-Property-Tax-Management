package com.smartmunicipal.propertytax.taxassessment;

import com.smartmunicipal.propertytax.dto.RegisterRequest;
import com.smartmunicipal.propertytax.dto.TaxAssessmentRequest;
import com.smartmunicipal.propertytax.dto.TaxAssessmentResponse;
import com.smartmunicipal.propertytax.dto.PropertyRequest;
import com.smartmunicipal.propertytax.enums.ConstructionType;
import com.smartmunicipal.propertytax.enums.Role;
import com.smartmunicipal.propertytax.repository.UserRepository;
import com.smartmunicipal.propertytax.service.PropertyService;
import com.smartmunicipal.propertytax.service.TaxAssessmentService;
import com.smartmunicipal.propertytax.service.UserService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.fail;

@SpringBootTest
@ActiveProfiles("test")
@Transactional
class TaxAssessmentDiagnosticTest {

    @Autowired private UserService userService;
    @Autowired private UserRepository userRepository;
    @Autowired private PropertyService propertyService;
    @Autowired private TaxAssessmentService assessmentService;

    @Test
    void diagnose_exactPostmanRequest_capturesRealException() {
        // Create owner
        Long ownerId = userRepository.findByEmail("diag.owner@test.com")
                .map(u -> u.getId())
                .orElseGet(() -> {
                    RegisterRequest r = new RegisterRequest();
                    r.setName("Diag Owner");
                    r.setEmail("diag.owner@test.com");
                    r.setPhoneNumber("9200000001");
                    r.setPassword("Pass@1234");
                    r.setRole(Role.PROPERTY_OWNER);
                    return userService.register(r).getId();
                });

        // Create property (simulating property ID 3 from Postman)
        PropertyRequest propReq = new PropertyRequest();
        propReq.setPropertyId("DIAG-PROP-001");
        propReq.setOwnerId(ownerId);
        propReq.setAddress("30 Gandhi Road, Chennai");
        propReq.setWardNo("WARD-07");
        propReq.setAreaSqft(new BigDecimal("1400.00"));
        propReq.setConstructionType(ConstructionType.RESIDENTIAL);
        propReq.setAssessedValue(new BigDecimal("4800000.00"));
        propReq.setLat(new BigDecimal("13.080000"));
        propReq.setLng(new BigDecimal("80.270000"));
        Long propertyDbId = propertyService.createProperty(propReq).getId();

        // Exact request body from Postman
        TaxAssessmentRequest req = new TaxAssessmentRequest();
        req.setPropertyId(propertyDbId);
        req.setFinancialYear("2025-26");
        req.setTaxAmount(new BigDecimal("25000.00"));
        req.setPenalty(new BigDecimal("0.00"));
        req.setTotalDue(new BigDecimal("25000.00"));
        req.setStatus(com.smartmunicipal.propertytax.enums.TaxAssessmentStatus.PENDING);

        try {
            TaxAssessmentResponse response = assessmentService.createAssessment(req);
            // If we get here, the service works — print the response
            System.out.println("SUCCESS: id=" + response.getId()
                    + " propertyId=" + response.getPropertyId()
                    + " year=" + response.getFinancialYear()
                    + " status=" + response.getStatus());
            assertThat(response.getId()).isPositive();
        } catch (Exception e) {
            // Print the FULL exception chain so we can see the real cause
            System.err.println("=== DIAGNOSTIC: REAL EXCEPTION ===");
            System.err.println("Type   : " + e.getClass().getName());
            System.err.println("Message: " + e.getMessage());
            Throwable cause = e.getCause();
            int depth = 0;
            while (cause != null && depth < 5) {
                System.err.println("Cause[" + depth + "]: " + cause.getClass().getName() + ": " + cause.getMessage());
                cause = cause.getCause();
                depth++;
            }
            e.printStackTrace(System.err);
            fail("createAssessment threw: " + e.getClass().getName() + ": " + e.getMessage());
        }
    }
}
