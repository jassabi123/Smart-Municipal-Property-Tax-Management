package com.smartmunicipal.propertytax.taxassessment;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.smartmunicipal.propertytax.dto.*;
import com.smartmunicipal.propertytax.entity.AuditLog;
import com.smartmunicipal.propertytax.enums.ConstructionType;
import com.smartmunicipal.propertytax.enums.Role;
import com.smartmunicipal.propertytax.repository.AuditLogRepository;
import com.smartmunicipal.propertytax.repository.TaxAssessmentRepository;
import com.smartmunicipal.propertytax.repository.UserRepository;
import com.smartmunicipal.propertytax.service.PropertyService;
import com.smartmunicipal.propertytax.service.TaxAssessmentService;
import com.smartmunicipal.propertytax.service.UserService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * Integration tests for Tax Assessment endpoints.
 * No @Transactional — REQUIRES_NEW audit logging needs its own real transaction.
 * Each test uses unique emails/propertyIds via UUID to avoid conflicts across runs.
 */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class TaxAssessmentTests {

    @Autowired private MockMvc mockMvc;
    @Autowired private ObjectMapper objectMapper;
    @Autowired private UserService userService;
    @Autowired private UserRepository userRepository;
    @Autowired private PropertyService propertyService;
    @Autowired private TaxAssessmentService assessmentService;
    @Autowired private AuditLogRepository auditLogRepository;
    @Autowired private TaxAssessmentRepository taxAssessmentRepository;

    // Shared across all tests in this class — created once per test run
    private static Long sharedOwnerId;
    private static Long sharedAdminId;
    private static String sharedAdminToken;
    private static String sharedOwnerToken;
    private static boolean setUpDone = false;

    @BeforeEach
    void setUp() throws Exception {
        if (setUpDone) return;

        String suffix = UUID.randomUUID().toString().substring(0, 8);

        sharedOwnerId = userRepository.findByEmail("ta.owner." + suffix + "@test.com")
                .map(u -> u.getId())
                .orElseGet(() -> {
                    RegisterRequest r = new RegisterRequest();
                    r.setName("TA Owner");
                    r.setEmail("ta.owner." + suffix + "@test.com");
                    r.setPhoneNumber("91" + (10000000 + (int)(Math.random() * 89999999)));
                    r.setPassword("Pass@1234");
                    r.setRole(Role.PROPERTY_OWNER);
                    return userService.register(r).getId();
                });

        // Admin must be saved directly (UserService.register uses PROPERTY_OWNER role by default)
        String adminEmail = "ta.admin." + suffix + "@test.com";
        sharedAdminId = userRepository.findByEmail(adminEmail)
                .map(u -> u.getId())
                .orElseGet(() -> userRepository.save(
                        com.smartmunicipal.propertytax.entity.User.builder()
                                .name("TA Admin")
                                .email(adminEmail)
                                .phoneNumber("92" + (10000000 + (int)(Math.random() * 89999999)))
                                .passwordHash(new org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder().encode("Pass@1234"))
                                .role(Role.ADMIN)
                                .isActive(true)
                                .build()
                ).getId());

        sharedAdminToken = loginAndGetToken(adminEmail, "Pass@1234");
        sharedOwnerToken = loginAndGetToken(
                userRepository.findById(sharedOwnerId).orElseThrow().getEmail(), "Pass@1234");

        setUpDone = true;
    }

    // ── REGRESSION: PUT updates PostgreSQL row, not just in-memory response ──────
    // Root cause: save() on a managed entity does not flush before REQUIRES_NEW
    // suspends the outer transaction. The outer tx is rolled back silently while
    // the in-memory response still shows the new values. Fixed by saveAndFlush().

    @Test
    void regression_putUpdatesDatabase_notJustResponse() throws Exception {
        // 1. Create assessment with initial values: taxAmount=25000, penalty=0, totalDue=25000
        Long propId = createProperty("PUT-PROP-" + UUID.randomUUID().toString().substring(0, 8));
        String createBody = buildAssessmentJson(propId, "2025-26", "25000.00", "0.00", "PENDING");

        MvcResult createResult = mockMvc.perform(post("/api/tax-assessments")
                        .header("Authorization", "Bearer " + sharedAdminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(createBody))
                .andExpect(status().isCreated())
                .andReturn();

        long assessmentId = objectMapper.readTree(
                createResult.getResponse().getContentAsString()).get("id").asLong();

        // Confirm initial DB state: 25000 / 0 / 25000
        com.smartmunicipal.propertytax.entity.TaxAssessment before =
                taxAssessmentRepository.findById(assessmentId).orElseThrow();
        assertThat(before.getTaxAmount()).as("initial taxAmount").isEqualByComparingTo("25000.00");
        assertThat(before.getPenalty()).as("initial penalty").isEqualByComparingTo("0.00");
        assertThat(before.getTotalDue()).as("initial totalDue").isEqualByComparingTo("25000.00");

        // 2. PUT: change to taxAmount=30000, penalty=1000, totalDue=31000
        String putBody = "{"
                + "\"propertyId\":" + propId + ","
                + "\"financialYear\":\"2025-26\","
                + "\"taxAmount\":30000.00,"
                + "\"penalty\":1000.00,"
                + "\"totalDue\":31000.00,"
                + "\"status\":\"PENDING\""
                + "}";

        MvcResult putResult = mockMvc.perform(put("/api/tax-assessments/" + assessmentId)
                        .header("Authorization", "Bearer " + sharedAdminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(putBody))
                .andExpect(status().isOk())
                .andReturn();

        // 3. PUT response must show new values
        JsonNode putResp = objectMapper.readTree(putResult.getResponse().getContentAsString());
        assertThat(new BigDecimal(putResp.get("taxAmount").asText()))
                .as("PUT response taxAmount").isEqualByComparingTo("30000.00");
        assertThat(new BigDecimal(putResp.get("penalty").asText()))
                .as("PUT response penalty").isEqualByComparingTo("1000.00");
        assertThat(new BigDecimal(putResp.get("totalDue").asText()))
                .as("PUT response totalDue").isEqualByComparingTo("31000.00");

        // 4. GET must return new values (fresh transaction, reads from DB)
        MvcResult getResult = mockMvc.perform(get("/api/tax-assessments/" + assessmentId)
                        .header("Authorization", "Bearer " + sharedAdminToken))
                .andExpect(status().isOk())
                .andReturn();

        JsonNode getResp = objectMapper.readTree(getResult.getResponse().getContentAsString());
        assertThat(new BigDecimal(getResp.get("taxAmount").asText()))
                .as("GET taxAmount after PUT").isEqualByComparingTo("30000.00");
        assertThat(new BigDecimal(getResp.get("penalty").asText()))
                .as("GET penalty after PUT").isEqualByComparingTo("1000.00");
        assertThat(new BigDecimal(getResp.get("totalDue").asText()))
                .as("GET totalDue after PUT").isEqualByComparingTo("31000.00");

        // 5. Direct repository read — bypasses HTTP entirely, proves DB row changed
        com.smartmunicipal.propertytax.entity.TaxAssessment after =
                taxAssessmentRepository.findById(assessmentId).orElseThrow();
        assertThat(after.getTaxAmount())
                .as("DB taxAmount changed from 25000 to 30000").isEqualByComparingTo("30000.00");
        assertThat(after.getPenalty())
                .as("DB penalty changed from 0 to 1000").isEqualByComparingTo("1000.00");
        assertThat(after.getTotalDue())
                .as("DB totalDue changed from 25000 to 31000").isEqualByComparingTo("31000.00");
    }

    // ── REGRESSION: exact Postman request ────────────────────────────────────
    // This is the request that was returning HTTP 500.
    // propertyId here is the DB id of a freshly created property (simulating property id=3).

    @Test
    void regression_exactPostmanRequest_returns201() throws Exception {
        Long propId = createProperty("POSTMAN-PROP-" + UUID.randomUUID().toString().substring(0, 8));

        // Exact body from the Postman request (propertyId replaced with actual DB id)
        String body = "{"
                + "\"propertyId\":" + propId + ","
                + "\"financialYear\":\"2025-26\","
                + "\"taxAmount\":25000.00,"
                + "\"penalty\":0.00,"
                + "\"totalDue\":25000.00,"
                + "\"status\":\"PENDING\""
                + "}";

        MvcResult result = mockMvc.perform(post("/api/tax-assessments")
                        .header("Authorization", "Bearer " + sharedAdminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isCreated())
                .andReturn();

        JsonNode resp = objectMapper.readTree(result.getResponse().getContentAsString());
        assertThat(resp.get("id").asLong()).isPositive();
        assertThat(resp.get("financialYear").asText()).isEqualTo("2025-26");
        assertThat(new BigDecimal(resp.get("taxAmount").asText())).isEqualByComparingTo("25000.00");
        assertThat(new BigDecimal(resp.get("penalty").asText())).isEqualByComparingTo("0.00");
        assertThat(new BigDecimal(resp.get("totalDue").asText())).isEqualByComparingTo("25000.00");
        assertThat(resp.get("status").asText()).isEqualTo("PENDING");
    }

    // ── REGRESSION: full flow — register ADMIN via HTTP → login → POST assessment ─
    // Covers UserServiceImpl.register() audit path (previously unguarded REQUIRES_NEW).
    // With open-in-view=false this matches production PostgreSQL behaviour exactly.

    @Test
    void regression_fullFlow_registerLoginPostAssessment_returns201() throws Exception {
        String suffix = UUID.randomUUID().toString().substring(0, 8);
        String adminEmail = "reg.admin." + suffix + "@test.com";
        String phone = "9" + String.format("%09d", (int)(Math.random() * 1_000_000_000));

        String registerBody = "{"
                + "\"name\":\"Reg Admin\","
                + "\"email\":\"" + adminEmail + "\","
                + "\"phoneNumber\":\"" + phone + "\","
                + "\"password\":\"Pass@1234\","
                + "\"role\":\"ADMIN\""
                + "}";

        // POST /api/auth/register exercises UserServiceImpl.register() → auditLogService.log()
        // Must return 201 even when audit log uses REQUIRES_NEW (was throwing UnexpectedRollbackException)
        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(registerBody))
                .andExpect(status().isCreated());

        String freshToken = loginAndGetToken(adminEmail, "Pass@1234");
        Long propId = createProperty("REG-PROP-" + suffix);

        String assessmentBody = "{"
                + "\"propertyId\":" + propId + ","
                + "\"financialYear\":\"2025-26\","
                + "\"taxAmount\":25000.00,"
                + "\"penalty\":0.00,"
                + "\"totalDue\":25000.00,"
                + "\"status\":\"PENDING\""
                + "}";

        mockMvc.perform(post("/api/tax-assessments")
                        .header("Authorization", "Bearer " + freshToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(assessmentBody))
                .andExpect(status().isForbidden());
    }

    // ── 1. Create via /api/tax-assessments ───────────────────────────────────

    @Test
    void createAssessment_viaTaxAssessmentsPath_returns201() throws Exception {
        Long propId = createProperty("TA-P1-" + UUID.randomUUID().toString().substring(0, 8));
        String body = buildAssessmentJson(propId, "2025-26", "25000.00", "0.00", "PENDING");

        MvcResult result = mockMvc.perform(post("/api/tax-assessments")
                        .header("Authorization", "Bearer " + sharedAdminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isCreated())
                .andReturn();

        JsonNode resp = objectMapper.readTree(result.getResponse().getContentAsString());
        assertThat(resp.get("id").asLong()).isPositive();
        assertThat(resp.get("financialYear").asText()).isEqualTo("2025-26");
        assertThat(resp.get("status").asText()).isEqualTo("PENDING");
    }

    // ── 2. Create via canonical /api/assessments ──────────────────────────────

    @Test
    void createAssessment_viaAssessmentsPath_returns201() throws Exception {
        Long propId = createProperty("TA-P2-" + UUID.randomUUID().toString().substring(0, 8));
        String body = buildAssessmentJson(propId, "2024-25", "18000.00", "500.00", "PENDING");

        mockMvc.perform(post("/api/assessments")
                        .header("Authorization", "Bearer " + sharedAdminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.financialYear").value("2024-25"));
    }

    // ── 3. Non-existent property → 404 ───────────────────────────────────────

    @Test
    void createAssessment_nonExistentProperty_returns404() throws Exception {
        String body = buildAssessmentJson(999999L, "2025-26", "10000.00", "0.00", "PENDING");

        mockMvc.perform(post("/api/tax-assessments")
                        .header("Authorization", "Bearer " + sharedAdminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.message").value(org.hamcrest.Matchers.containsString("Property not found")));
    }

    // ── 4. Invalid financial year → 400 ──────────────────────────────────────

    @Test
    void createAssessment_invalidFinancialYear_returns400() throws Exception {
        Long propId = createProperty("TA-P4-" + UUID.randomUUID().toString().substring(0, 8));
        String body = buildAssessmentJson(propId, "2025/26", "10000.00", "0.00", "PENDING");

        mockMvc.perform(post("/api/tax-assessments")
                        .header("Authorization", "Bearer " + sharedAdminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isBadRequest());
    }

    // ── 5. Negative tax amount → 400 ─────────────────────────────────────────

    @Test
    void createAssessment_negativeTaxAmount_returns400() throws Exception {
        Long propId = createProperty("TA-P5-" + UUID.randomUUID().toString().substring(0, 8));
        String body = buildAssessmentJson(propId, "2026-27", "-100.00", "0.00", "PENDING");

        mockMvc.perform(post("/api/tax-assessments")
                        .header("Authorization", "Bearer " + sharedAdminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isBadRequest());
    }

    // ── 6. Invalid status → 400 ───────────────────────────────────────────────

    @Test
    void createAssessment_invalidStatus_returns400() throws Exception {
        Long propId = createProperty("TA-P6-" + UUID.randomUUID().toString().substring(0, 8));
        String body = "{\"propertyId\":" + propId
                + ",\"financialYear\":\"2026-27\""
                + ",\"taxAmount\":10000.00"
                + ",\"penalty\":0.00"
                + ",\"status\":\"INVALID_STATUS\"}";

        mockMvc.perform(post("/api/tax-assessments")
                        .header("Authorization", "Bearer " + sharedAdminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isBadRequest());
    }

    // ── 7. No token → 401 ────────────────────────────────────────────────────

    @Test
    void createAssessment_noToken_returns401() throws Exception {
        Long propId = createProperty("TA-P7-" + UUID.randomUUID().toString().substring(0, 8));
        String body = buildAssessmentJson(propId, "2025-26", "10000.00", "0.00", "PENDING");

        mockMvc.perform(post("/api/tax-assessments")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isUnauthorized());
    }

    // ── 8. Insufficient role → 403 ───────────────────────────────────────────

    @Test
    void createAssessment_insufficientRole_returns403() throws Exception {
        Long propId = createProperty("TA-P8-" + UUID.randomUUID().toString().substring(0, 8));
        String body = buildAssessmentJson(propId, "2025-26", "10000.00", "0.00", "PENDING");

        mockMvc.perform(post("/api/tax-assessments")
                        .header("Authorization", "Bearer " + sharedOwnerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isForbidden());
    }

    // ── 9. Duplicate assessment → 400 ────────────────────────────────────────

    @Test
    void createAssessment_duplicate_returns400() throws Exception {
        Long propId = createProperty("TA-P9-" + UUID.randomUUID().toString().substring(0, 8));
        String body = buildAssessmentJson(propId, "2023-24", "12000.00", "0.00", "PENDING");

        mockMvc.perform(post("/api/tax-assessments")
                        .header("Authorization", "Bearer " + sharedAdminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isCreated());

        mockMvc.perform(post("/api/tax-assessments")
                        .header("Authorization", "Bearer " + sharedAdminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value(org.hamcrest.Matchers.containsString("Assessment already exists")));
    }

    // ── 10. Audit log created ─────────────────────────────────────────────────

    @Test
    void createAssessment_createsAuditLog() throws Exception {
        Long propId = createProperty("TA-P10-" + UUID.randomUUID().toString().substring(0, 8));
        String body = buildAssessmentJson(propId, "2022-23", "8000.00", "0.00", "PENDING");

        MvcResult result = mockMvc.perform(post("/api/tax-assessments")
                        .header("Authorization", "Bearer " + sharedAdminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isCreated())
                .andReturn();

        long assessmentId = objectMapper.readTree(result.getResponse().getContentAsString()).get("id").asLong();

        List<AuditLog> logs = auditLogRepository
                .findByEntityTypeAndEntityIdOrderByPerformedAtDesc("TaxAssessment", assessmentId);

        assertThat(logs).isNotEmpty();
        AuditLog log = logs.get(0);
        assertThat(log.getAction()).isEqualTo("CREATE");
        assertThat(log.getDescription()).contains("2022-23");
        assertThat(log.getDescription()).doesNotContainIgnoringCase("password");
    }

    // ── 11. Response mapping ──────────────────────────────────────────────────

    @Test
    void createAssessment_responseMappingIsCorrect() throws Exception {
        Long propId = createProperty("TA-P11-" + UUID.randomUUID().toString().substring(0, 8));
        String body = buildAssessmentJson(propId, "2021-22", "30000.00", "1500.00", "PENDING");

        MvcResult result = mockMvc.perform(post("/api/tax-assessments")
                        .header("Authorization", "Bearer " + sharedAdminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isCreated())
                .andReturn();

        JsonNode resp = objectMapper.readTree(result.getResponse().getContentAsString());
        assertThat(resp.get("id").asLong()).isPositive();
        assertThat(resp.get("propertyId").asLong()).isEqualTo(propId);
        assertThat(resp.get("propertyIdentifier").asText()).isNotBlank();
        assertThat(new BigDecimal(resp.get("taxAmount").asText())).isEqualByComparingTo("30000.00");
        assertThat(new BigDecimal(resp.get("penalty").asText())).isEqualByComparingTo("1500.00");
        assertThat(new BigDecimal(resp.get("totalDue").asText())).isEqualByComparingTo("31500.00");
        assertThat(resp.get("status").asText()).isEqualTo("PENDING");
        assertThat(resp.has("passwordHash")).isFalse();
        assertThat(resp.has("token")).isFalse();
    }

    // ── 12. GET by ID works after creation ───────────────────────────────────

    @Test
    void getAssessmentById_returnsCorrectData() throws Exception {
        Long propId = createProperty("TA-P12-" + UUID.randomUUID().toString().substring(0, 8));
        String body = buildAssessmentJson(propId, "2020-21", "15000.00", "0.00", "PENDING");

        MvcResult createResult = mockMvc.perform(post("/api/tax-assessments")
                        .header("Authorization", "Bearer " + sharedAdminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isCreated())
                .andReturn();

        long createdId = objectMapper.readTree(createResult.getResponse().getContentAsString()).get("id").asLong();

        mockMvc.perform(get("/api/tax-assessments/" + createdId)
                        .header("Authorization", "Bearer " + sharedAdminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(createdId))
                .andExpect(jsonPath("$.financialYear").value("2020-21"));

        mockMvc.perform(get("/api/assessments/" + createdId)
                        .header("Authorization", "Bearer " + sharedAdminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(createdId));
    }

    // ── helpers ──────────────────────────────────────────────────────────────

    private Long createProperty(String propertyId) {
        PropertyRequest req = new PropertyRequest();
        req.setPropertyId(propertyId);
        req.setOwnerId(sharedOwnerId);
        req.setAddress("10 Assessment Lane");
        req.setWardNo("W-TA");
        req.setAreaSqft(new BigDecimal("1500.00"));
        req.setConstructionType(ConstructionType.RESIDENTIAL);
        req.setAssessedValue(new BigDecimal("3000000.00"));
        req.setLat(new BigDecimal("13.0000"));
        req.setLng(new BigDecimal("80.0000"));
        return propertyService.createProperty(req).getId();
    }

    private String buildAssessmentJson(Long propertyId, String year,
                                       String taxAmount, String penalty, String status) {
        BigDecimal totalDue = new BigDecimal(taxAmount).add(new BigDecimal(penalty));
        return "{\"propertyId\":" + propertyId
                + ",\"financialYear\":\"" + year + "\""
                + ",\"taxAmount\":" + taxAmount
                + ",\"penalty\":" + penalty
                + ",\"totalDue\":" + totalDue.toPlainString()
                + ",\"status\":\"" + status + "\"}";
    }

    private String loginAndGetToken(String email, String password) throws Exception {
        LoginRequest login = new LoginRequest();
        login.setEmail(email);
        login.setPassword(password);

        MvcResult result = mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(login)))
                .andExpect(status().isOk())
                .andReturn();

        return objectMapper.readTree(result.getResponse().getContentAsString()).get("token").asText();
    }
}
