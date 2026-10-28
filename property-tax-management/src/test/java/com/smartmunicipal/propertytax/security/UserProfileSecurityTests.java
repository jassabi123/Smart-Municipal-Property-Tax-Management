package com.smartmunicipal.propertytax.security;

import static org.assertj.core.api.Assertions.assertThat;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.smartmunicipal.propertytax.dto.LoginRequest;
import com.smartmunicipal.propertytax.dto.RegisterRequest;
import com.smartmunicipal.propertytax.enums.Role;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class UserProfileSecurityTests {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    private String aliceToken;
    private String bobToken;

    @BeforeEach
    void setUp() throws Exception {
        aliceToken = registerAndLogin("alice.profile@test.com", "9000000101", "Alice Profile");
        bobToken = registerAndLogin("bob.profile@test.com", "9000000102", "Bob Profile");
    }

    @Test
    void authenticatedUser_canAccessOwnProfile() throws Exception {
        mockMvc.perform(get("/api/users/profile")
                        .header("Authorization", "Bearer " + aliceToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.email").value("alice.profile@test.com"))
                .andExpect(jsonPath("$.name").value("Alice Profile"));
    }

    @Test
    void unauthenticatedRequest_isRejected() throws Exception {
        mockMvc.perform(get("/api/users/profile"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void profileEndpoint_returnsOnlyAuthenticatedUsersOwnData() throws Exception {
        // Alice's token must only ever return Alice's profile — never Bob's
        MvcResult result = mockMvc.perform(get("/api/users/profile")
                        .header("Authorization", "Bearer " + aliceToken))
                .andExpect(status().isOk())
                .andReturn();

        JsonNode body = objectMapper.readTree(result.getResponse().getContentAsString());
        assertThat(body.get("email").asText()).isEqualTo("alice.profile@test.com");
        assertThat(body.get("email").asText()).isNotEqualTo("bob.profile@test.com");
    }

    @Test
    void profileEndpoint_doesNotAcceptUserIdParameter() throws Exception {
        // The endpoint must not allow a user-supplied ID to fetch another user's profile
        mockMvc.perform(get("/api/users/profile")
                        .header("Authorization", "Bearer " + aliceToken)
                        .param("id", "1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.email").value("alice.profile@test.com"));
    }

    private String registerAndLogin(String email, String phone, String name) throws Exception {
        // Register (tolerate if already registered from a previous test run in the same JVM)
        RegisterRequest register = new RegisterRequest();
        register.setName(name);
        register.setEmail(email);
        register.setPhoneNumber(phone);
        register.setPassword("Pass@1234");
        register.setRole(Role.PROPERTY_OWNER);

        MvcResult regResult = mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(register)))
                .andReturn();

        // 201 = created, 400 = already registered (acceptable)
        assertThat(regResult.getResponse().getStatus())
                .isIn(201, 400);

        // Login to obtain a token
        LoginRequest login = new LoginRequest();
        login.setEmail(email);
        login.setPassword("Pass@1234");

        MvcResult result = mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(login)))
                .andExpect(status().isOk())
                .andReturn();

        JsonNode body = objectMapper.readTree(result.getResponse().getContentAsString());
        return body.get("token").asText();
    }
}