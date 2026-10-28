package com.smartmunicipal.propertytax.security;

import com.smartmunicipal.propertytax.enums.Role;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;

import static org.assertj.core.api.Assertions.assertThat;

class SecurityLayerTests {

    private JwtService jwtService;
    private PasswordEncoder passwordEncoder;

    private static final String SECRET =
            "TestSecretKeyForUnitTestsOnlyNotUsedInProduction256Bits";
    private static final long EXPIRY_MS = 28800000L;

    @BeforeEach
    void setUp() {
        jwtService = new JwtService(SECRET, EXPIRY_MS, EXPIRY_MS * 3, EXPIRY_MS);
        passwordEncoder = new BCryptPasswordEncoder();
    }

    // ── JWT generation ──────────────────────────────────────────────────────

    @Test
    void generateToken_containsExpectedClaims() {
        String token = jwtService.generateToken(1L, "user@test.com", Role.PROPERTY_OWNER);

        assertThat(token).isNotBlank();
        assertThat(jwtService.extractUsername(token)).isEqualTo("user@test.com");
        assertThat(jwtService.extractUserId(token)).isEqualTo(1L);
        assertThat(jwtService.extractRole(token)).isEqualTo(Role.PROPERTY_OWNER);
    }

    @Test
    void generateToken_adminRole_hasLongerExpiry() {
        String adminToken = jwtService.generateToken(2L, "admin@test.com", Role.ADMIN);
        String userToken  = jwtService.generateToken(3L, "user@test.com",  Role.PROPERTY_OWNER);

        long adminExp = jwtService.extractExpiration(adminToken).getTime();
        long userExp  = jwtService.extractExpiration(userToken).getTime();

        assertThat(adminExp).isGreaterThan(userExp);
    }

    // ── Token validation ────────────────────────────────────────────────────

    @Test
    void isTokenValid_validToken_returnsTrue() {
        String token = jwtService.generateToken(1L, "user@test.com", Role.PROPERTY_OWNER);
        assertThat(jwtService.isTokenValid(token, "user@test.com")).isTrue();
    }

    @Test
    void isTokenValid_wrongEmail_returnsFalse() {
        String token = jwtService.generateToken(1L, "user@test.com", Role.PROPERTY_OWNER);
        assertThat(jwtService.isTokenValid(token, "other@test.com")).isFalse();
    }

    @Test
    void isTokenValid_expiredToken_returnsFalse() {
        JwtService shortLived = new JwtService(SECRET, 1L, 1L, 1L);
        String token = shortLived.generateToken(1L, "user@test.com", Role.PROPERTY_OWNER);
        try { Thread.sleep(20); } catch (InterruptedException ignored) {}
        assertThat(shortLived.isTokenValid(token, "user@test.com")).isFalse();
    }

    @Test
    void isTokenValid_tamperedToken_returnsFalse() {
        String token = jwtService.generateToken(1L, "user@test.com", Role.PROPERTY_OWNER);
        String tampered = token.substring(0, token.length() - 5) + "XXXXX";
        assertThat(jwtService.isTokenValid(tampered, "user@test.com")).isFalse();
    }

    @Test
    void isTokenValid_malformedToken_returnsFalse() {
        assertThat(jwtService.isTokenValid("not.a.jwt", "user@test.com")).isFalse();
    }

    // ── Role extraction ─────────────────────────────────────────────────────

    @Test
    void extractRole_allRoles_correctlyExtracted() {
        for (Role role : Role.values()) {
            String token = jwtService.generateToken(1L, "u@test.com", role);
            assertThat(jwtService.extractRole(token)).isEqualTo(role);
        }
    }

    // ── BCrypt password hashing ─────────────────────────────────────────────

    @Test
    void bcrypt_passwordNeverStoredPlainText() {
        String raw = "SecurePass@123";
        String hashed = passwordEncoder.encode(raw);
        assertThat(hashed).isNotEqualTo(raw);
        assertThat(hashed).startsWith("$2a$");
    }

    @Test
    void bcrypt_correctPassword_matches() {
        String raw = "SecurePass@123";
        String hashed = passwordEncoder.encode(raw);
        assertThat(passwordEncoder.matches(raw, hashed)).isTrue();
    }

    @Test
    void bcrypt_wrongPassword_doesNotMatch() {
        String hashed = passwordEncoder.encode("SecurePass@123");
        assertThat(passwordEncoder.matches("WrongPass@456", hashed)).isFalse();
    }

    @Test
    void bcrypt_twoHashesOfSamePassword_areDifferent() {
        String raw = "SecurePass@123";
        String hash1 = passwordEncoder.encode(raw);
        String hash2 = passwordEncoder.encode(raw);
        assertThat(hash1).isNotEqualTo(hash2);
        assertThat(passwordEncoder.matches(raw, hash1)).isTrue();
        assertThat(passwordEncoder.matches(raw, hash2)).isTrue();
    }
}
