package com.smartmunicipal.propertytax.service.impl;

import com.smartmunicipal.propertytax.dto.AuthResponse;
import com.smartmunicipal.propertytax.dto.LoginRequest;
import com.smartmunicipal.propertytax.dto.RegisterRequest;
import com.smartmunicipal.propertytax.entity.User;
import com.smartmunicipal.propertytax.repository.UserRepository;
import com.smartmunicipal.propertytax.security.JwtService;
import com.smartmunicipal.propertytax.service.AuthService;
import com.smartmunicipal.propertytax.service.UserService;
import com.smartmunicipal.propertytax.dto.UserResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

import com.smartmunicipal.propertytax.dto.ForgotPasswordRequest;
import com.smartmunicipal.propertytax.dto.ResetPasswordRequest;
import com.smartmunicipal.propertytax.dto.VerifyOtpRequest;
import com.smartmunicipal.propertytax.entity.PasswordResetOtp;
import com.smartmunicipal.propertytax.exception.ResourceNotFoundException;
import com.smartmunicipal.propertytax.repository.PasswordResetOtpRepository;
import com.smartmunicipal.propertytax.service.AuditLogService;
import com.smartmunicipal.propertytax.service.OtpEmailService;
import org.springframework.security.crypto.password.PasswordEncoder;

@Service
@RequiredArgsConstructor
public class AuthServiceImpl implements AuthService {

    private final UserService userService;
    private final UserRepository userRepository;
    private final JwtService jwtService;
    private final AuthenticationManager authenticationManager;
    private final OtpEmailService otpEmailService;
    private final PasswordResetOtpRepository otpRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuditLogService auditLogService;

    @Override
    @Transactional
    public AuthResponse register(RegisterRequest request) {
        UserResponse userResponse = userService.register(request);
        String token = jwtService.generateToken(userResponse.getId(), userResponse.getEmail(), userResponse.getRole());
        return new AuthResponse(token, userResponse.getId(), userResponse.getName(), userResponse.getEmail(), userResponse.getRole());
    }

    @Override
    @Transactional
    public AuthResponse login(LoginRequest request) {
        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.getEmail(), request.getPassword()));

        User user = userRepository.findByEmail(request.getEmail()).orElseThrow();
        user.setLastLogin(LocalDateTime.now());
        userRepository.save(user);

        // Audit log login
        auditLogService.log(user.getId(), "LOGIN", "User", user.getId(), "User signed in successfully: " + user.getEmail(), null);

        String token = jwtService.generateToken(user.getId(), user.getEmail(), user.getRole());
        return new AuthResponse(token, user.getId(), user.getName(), user.getEmail(), user.getRole());
    }

    @Override
    @Transactional
    public void forgotPassword(ForgotPasswordRequest request) {
        String email = request.getEmail().toLowerCase().trim();
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("No registered account found with email: " + email));

        otpEmailService.generateAndSendOtp(email);

        auditLogService.log(user.getId(), "FORGOT_PASSWORD_REQUEST", "User", user.getId(),
                "Password reset OTP requested for email: " + email, null);
    }

    @Override
    @Transactional(readOnly = true)
    public boolean verifyResetOtp(VerifyOtpRequest request) {
        String email = request.getEmail().toLowerCase().trim();
        String otp = request.getOtp().trim();

        PasswordResetOtp resetOtp = otpRepository.findTopByEmailAndOtpAndUsedFalseOrderByCreatedDateDesc(email, otp)
                .orElseThrow(() -> new IllegalArgumentException("Invalid OTP or OTP has already been used."));

        if (resetOtp.isExpired()) {
            throw new IllegalArgumentException("The OTP has expired. Please request a new OTP.");
        }

        return true;
    }

    @Override
    @Transactional
    public void resetPassword(ResetPasswordRequest request) {
        String email = request.getEmail().toLowerCase().trim();
        String otp = request.getOtp().trim();

        PasswordResetOtp resetOtp = otpRepository.findTopByEmailAndOtpAndUsedFalseOrderByCreatedDateDesc(email, otp)
                .orElseThrow(() -> new IllegalArgumentException("Invalid or expired OTP."));

        if (resetOtp.isExpired()) {
            throw new IllegalArgumentException("The OTP has expired. Please request a new OTP.");
        }

        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("No registered account found with email: " + email));

        user.setPasswordHash(passwordEncoder.encode(request.getNewPassword()));
        userRepository.save(user);

        resetOtp.setUsed(true);
        otpRepository.save(resetOtp);

        auditLogService.log(user.getId(), "PASSWORD_RESET", "User", user.getId(),
                "Password successfully updated via OTP verification", null);
    }
}
