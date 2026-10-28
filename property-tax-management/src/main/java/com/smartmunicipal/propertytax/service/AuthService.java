package com.smartmunicipal.propertytax.service;

import com.smartmunicipal.propertytax.dto.AuthResponse;
import com.smartmunicipal.propertytax.dto.LoginRequest;
import com.smartmunicipal.propertytax.dto.RegisterRequest;

import com.smartmunicipal.propertytax.dto.ForgotPasswordRequest;
import com.smartmunicipal.propertytax.dto.VerifyOtpRequest;
import com.smartmunicipal.propertytax.dto.ResetPasswordRequest;

public interface AuthService {

    AuthResponse register(RegisterRequest request);

    AuthResponse login(LoginRequest request);

    void forgotPassword(ForgotPasswordRequest request);

    boolean verifyResetOtp(VerifyOtpRequest request);

    void resetPassword(ResetPasswordRequest request);
}
