package com.smartmunicipal.propertytax.security;

import com.smartmunicipal.propertytax.enums.Role;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.Date;
import java.util.Map;

@Service
public class JwtService {

    private final SecretKey signingKey;
    private final long defaultExpirationMs;
    private final long adminExpirationMs;
    private final long staffExpirationMs;

    public JwtService(
            @Value("${app.jwt.secret}") String secret,
            @Value("${app.jwt.expiration-ms:28800000}") long defaultExpirationMs,
            @Value("${app.jwt.admin-expiration-ms:86400000}") long adminExpirationMs,
            @Value("${app.jwt.staff-expiration-ms:43200000}") long staffExpirationMs) {
        this.signingKey = Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8));
        this.defaultExpirationMs = defaultExpirationMs;
        this.adminExpirationMs = adminExpirationMs;
        this.staffExpirationMs = staffExpirationMs;
    }

    public String generateToken(Long userId, String email, Role role) {
        long expiry = resolveExpiry(role);
        return Jwts.builder()
                .subject(email)
                .claims(Map.of(
                        "userId", userId,
                        "role", role.name()
                ))
                .issuedAt(new Date())
                .expiration(new Date(System.currentTimeMillis() + expiry))
                .signWith(signingKey)
                .compact();
    }

    public String extractUsername(String token) {
        return parseClaims(token).getSubject();
    }

    public Long extractUserId(String token) {
        Object val = parseClaims(token).get("userId");
        if (val instanceof Integer i) return i.longValue();
        if (val instanceof Long l) return l;
        return Long.parseLong(val.toString());
    }

    public Role extractRole(String token) {
        return Role.valueOf((String) parseClaims(token).get("role"));
    }

    public Date extractExpiration(String token) {
        return parseClaims(token).getExpiration();
    }

    public boolean isTokenValid(String token, String email) {
        try {
            String subject = extractUsername(token);
            return subject.equals(email) && !isTokenExpired(token);
        } catch (JwtException | IllegalArgumentException e) {
            return false;
        }
    }

    private boolean isTokenExpired(String token) {
        return extractExpiration(token).before(new Date());
    }

    private Claims parseClaims(String token) {
        return Jwts.parser()
                .verifyWith(signingKey)
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }

    private long resolveExpiry(Role role) {
        return switch (role) {
            case ADMIN -> adminExpirationMs;
            case WARD_OFFICER, TAX_ASSESSOR, FINANCE_OFFICER, COMMISSIONER -> staffExpirationMs;
            default -> defaultExpirationMs;
        };
    }
}
