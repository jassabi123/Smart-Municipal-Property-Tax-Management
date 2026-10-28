package com.smartmunicipal.propertytax.controller;

import com.smartmunicipal.propertytax.dto.AuthResponse;
import com.smartmunicipal.propertytax.dto.LoginRequest;
import com.smartmunicipal.propertytax.dto.RegisterRequest;
import com.smartmunicipal.propertytax.security.JwtService;
import com.smartmunicipal.propertytax.security.TokenBlacklistService;
import com.smartmunicipal.propertytax.service.AuthService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Date;
import java.util.Map;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
@Tag(name = "Authentication", description = "Register, login, logout")
public class AuthController {

    private final AuthService authService;
    private final JwtService jwtService;
    private final TokenBlacklistService tokenBlacklistService;

    @PostMapping("/register")
    @Operation(summary = "Register a new user")
    public ResponseEntity<AuthResponse> register(
            @Valid @RequestBody RegisterRequest request) {

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(authService.register(request));
    }

    @PostMapping("/login")
    @Operation(summary = "Login and receive JWT token")
    public ResponseEntity<AuthResponse> login(
            @Valid @RequestBody LoginRequest request) {

        return ResponseEntity.ok(authService.login(request));
    }

    @PostMapping("/logout")
    @Operation(summary = "Logout and invalidate the current JWT token")
    public ResponseEntity<Map<String, String>> logout(
            @RequestHeader(value = "Authorization", required = false)
            String authHeader) {

        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("message", "Authorization token is required."));
        }

        String token = authHeader.substring(7);

        try {
            Date expiration = jwtService.extractExpiration(token);

            tokenBlacklistService.blacklist(
                    token,
                    expiration.getTime()
            );

            return ResponseEntity.ok(
                    Map.of("message", "Logged out successfully.")
            );

        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("message", "Invalid or expired token."));
        }
    }

    @PostMapping("/forgot-password")
    @Operation(summary = "Request password reset OTP to registered email")
    public ResponseEntity<Map<String, String>> forgotPassword(
            @Valid @RequestBody com.smartmunicipal.propertytax.dto.ForgotPasswordRequest request) {
        authService.forgotPassword(request);
        return ResponseEntity.ok(Map.of("message", "Password reset OTP has been sent to your registered email."));
    }

    @PostMapping("/verify-reset-otp")
    @Operation(summary = "Verify OTP for password reset")
    public ResponseEntity<Map<String, Object>> verifyResetOtp(
            @Valid @RequestBody com.smartmunicipal.propertytax.dto.VerifyOtpRequest request) {
        boolean valid = authService.verifyResetOtp(request);
        return ResponseEntity.ok(Map.of("verified", valid, "message", "OTP verified successfully."));
    }

    @PostMapping("/reset-password")
    @Operation(summary = "Reset password using verified OTP")
    public ResponseEntity<Map<String, String>> resetPassword(
            @Valid @RequestBody com.smartmunicipal.propertytax.dto.ResetPasswordRequest request) {
        authService.resetPassword(request);
        return ResponseEntity.ok(Map.of("message", "Password has been reset successfully. You can now log in."));
    }
}