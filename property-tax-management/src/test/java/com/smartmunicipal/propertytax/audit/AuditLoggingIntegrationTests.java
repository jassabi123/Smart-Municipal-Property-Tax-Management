package com.smartmunicipal.propertytax.audit;

import com.smartmunicipal.propertytax.dto.*;
import com.smartmunicipal.propertytax.entity.AuditLog;
import com.smartmunicipal.propertytax.enums.ConstructionType;
import com.smartmunicipal.propertytax.enums.PaymentMode;
import com.smartmunicipal.propertytax.enums.Role;
import com.smartmunicipal.propertytax.repository.*;
import com.smartmunicipal.propertytax.service.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest
@ActiveProfiles("test")
@Transactional
class AuditLoggingIntegrationTests {

    @Autowired private UserService userService;
    @Autowired private PropertyService propertyService;
    @Autowired private TaxAssessmentService assessmentService;
    @Autowired private TaxPaymentService paymentService;
    @Autowired private NOCService nocService;
    @Autowired private AuditLogService auditLogService;
    @Autowired private AuditLogRepository auditLogRepository;
    @Autowired private UserRepository userRepository;

    private Long ownerId;
    private Long officerId;

    @BeforeEach
    void setUp() {
        ownerId = userRepository.findByEmail("alice.owner@test.com")
                .map(u -> u.getId())
                .orElseGet(() -> {
                    RegisterRequest r = new RegisterRequest();
                    r.setName("Alice Owner");
                    r.setEmail("alice.owner@test.com");
                    r.setPhoneNumber("9000000001");
                    r.setPassword("Pass@1234");
                    r.setRole(Role.PROPERTY_OWNER);
                    return userService.register(r).getId();
                });

        officerId = userRepository.findByEmail("bob.officer@test.com")
                .map(u -> u.getId())
                .orElseGet(() -> {
                    RegisterRequest r = new RegisterRequest();
                    r.setName("Bob Officer");
                    r.setEmail("bob.officer@test.com");
                    r.setPhoneNumber("9000000002");
                    r.setPassword("Pass@1234");
                    r.setRole(Role.WARD_OFFICER);
                    return userService.register(r).getId();
                });
    }

    // ── 1. Property creation creates an audit entry ──────────────────────────

    @Test
    void propertyCreate_createsAuditEntry() {
        PropertyResponse created = propertyService.createProperty(buildPropertyRequest("PROP-AUDIT-001"));

        List<AuditLog> logs = auditLogRepository
                .findByEntityTypeAndEntityIdOrderByPerformedAtDesc("Property", created.getId());

        assertThat(logs).isNotEmpty();
        AuditLog log = logs.get(0);
        assertThat(log.getAction()).isEqualTo("CREATE");
        assertThat(log.getEntityType()).isEqualTo("Property");
        assertThat(log.getEntityId()).isEqualTo(created.getId());
        assertThat(log.getDescription()).contains("PROP-AUDIT-001");
    }

    // ── 2. Property update creates an audit entry ────────────────────────────

    @Test
    void propertyUpdate_createsAuditEntry() {
        PropertyResponse created = propertyService.createProperty(buildPropertyRequest("PROP-AUDIT-002"));

        PropertyRequest updateReq = buildPropertyRequest("PROP-AUDIT-002");
        updateReq.setAddress("456 Updated Street");
        propertyService.updateProperty(created.getId(), updateReq);

        List<AuditLog> logs = auditLogRepository
                .findByEntityTypeAndEntityIdOrderByPerformedAtDesc("Property", created.getId());

        long updateCount = logs.stream().filter(l -> "UPDATE".equals(l.getAction())).count();
        assertThat(updateCount).isGreaterThanOrEqualTo(1);
    }

    // ── 3. Tax payment creates an audit entry ────────────────────────────────

    @Test
    void taxPayment_createsAuditEntry() {
        PropertyResponse property = propertyService.createProperty(buildPropertyRequest("PROP-AUDIT-003"));

        TaxAssessmentRequest assessReq = new TaxAssessmentRequest();
        assessReq.setPropertyId(property.getId());
        assessReq.setFinancialYear("2024-25");
        assessReq.setTaxAmount(new BigDecimal("5000.00"));
        assessReq.setPenalty(BigDecimal.ZERO);
        assessReq.setDueDate(LocalDate.now().plusMonths(3));
        TaxAssessmentResponse assessment = assessmentService.createAssessment(assessReq);

        TaxPaymentRequest payReq = new TaxPaymentRequest();
        payReq.setAssessmentId(assessment.getId());
        payReq.setAmountPaid(new BigDecimal("5000.00"));
        payReq.setPaymentMode(PaymentMode.UPI);
        payReq.setTransactionId("TXN-AUDIT-" + System.nanoTime());
        TaxPaymentResponse payment = paymentService.initiatePayment(payReq);

        List<AuditLog> logs = auditLogRepository
                .findByEntityTypeAndEntityIdOrderByPerformedAtDesc("TaxPayment", payment.getId());

        assertThat(logs).isNotEmpty();
        AuditLog log = logs.get(0);
        assertThat(log.getAction()).isEqualTo("PAYMENT");
        assertThat(log.getDescription()).contains("receipt=");
        assertThat(log.getDescription()).contains("assessmentId=");
    }

    // ── 4. NOC request creates an audit entry ────────────────────────────────

    @Test
    void nocRequest_createsAuditEntry() {
        PropertyResponse property = propertyService.createProperty(buildPropertyRequest("PROP-AUDIT-004"));

        NOCRequestDto nocReq = new NOCRequestDto();
        nocReq.setPropertyId(property.getId());
        nocReq.setRequestedById(ownerId);
        NOCResponseDto noc = nocService.requestNOC(nocReq);

        List<AuditLog> logs = auditLogRepository
                .findByEntityTypeAndEntityIdOrderByPerformedAtDesc("NOCRequest", noc.getId());

        assertThat(logs).isNotEmpty();
        assertThat(logs.get(0).getAction()).isEqualTo("CREATE");
        assertThat(logs.get(0).getDescription()).contains("NOC requested");
    }

    // ── 5. NOC issue creates an audit entry ──────────────────────────────────

    @Test
    void nocIssue_createsAuditEntry() {
        PropertyResponse property = propertyService.createProperty(buildPropertyRequest("PROP-AUDIT-005"));

        NOCRequestDto nocReq = new NOCRequestDto();
        nocReq.setPropertyId(property.getId());
        nocReq.setRequestedById(ownerId);
        NOCResponseDto noc = nocService.requestNOC(nocReq);

        nocService.issueNOC(noc.getId(), officerId, "All dues cleared");

        List<AuditLog> logs = auditLogRepository
                .findByEntityTypeAndEntityIdOrderByPerformedAtDesc("NOCRequest", noc.getId());

        assertThat(logs.stream().anyMatch(l -> "NOC_APPROVED".equals(l.getAction()) || "UPDATE".equals(l.getAction()))).isTrue();
        assertThat(logs.stream().anyMatch(l -> l.getDescription().contains("NOC issued"))).isTrue();
    }

    // ── 6. Audit descriptions must not contain passwords or JWT secrets ──────

    @Test
    void auditDescriptions_doNotContainSensitiveData() {
        RegisterRequest req = new RegisterRequest();
        req.setName("Charlie Test");
        req.setEmail("charlie.test@test.com");
        req.setPhoneNumber("9000000003");
        req.setPassword("SuperSecret@99");
        req.setRole(Role.PROPERTY_OWNER);
        UserResponse user = userService.register(req);

        List<AuditLog> logs = auditLogRepository
                .findByEntityTypeAndEntityIdOrderByPerformedAtDesc("User", user.getId());

        assertThat(logs).isNotEmpty();
        logs.forEach(log -> {
            String desc = log.getDescription() != null ? log.getDescription().toLowerCase() : "";
            assertThat(desc).doesNotContain("password");
            assertThat(desc).doesNotContain("supersecret");
            assertThat(desc).doesNotContain("eyj");   // JWT header prefix
        });
    }

    // ── helpers ──────────────────────────────────────────────────────────────

    private PropertyRequest buildPropertyRequest(String propertyId) {
        PropertyRequest req = new PropertyRequest();
        req.setPropertyId(propertyId);
        req.setOwnerId(ownerId);
        req.setAddress("123 Test Street");
        req.setWardNo("W01");
        req.setAreaSqft(new BigDecimal("1200.00"));
        req.setConstructionType(ConstructionType.RESIDENTIAL);
        req.setAssessedValue(new BigDecimal("500000.00"));
        req.setLat(new BigDecimal("12.9716"));
        req.setLng(new BigDecimal("77.5946"));
        return req;
    }
}
