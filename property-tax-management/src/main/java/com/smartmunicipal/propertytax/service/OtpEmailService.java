package com.smartmunicipal.propertytax.service;

import com.smartmunicipal.propertytax.entity.PasswordResetOtp;
import com.smartmunicipal.propertytax.repository.PasswordResetOtpRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.time.LocalDateTime;

@Service
@Slf4j
public class OtpEmailService {

    private final PasswordResetOtpRepository otpRepository;
    private final JavaMailSender mailSender;
    private final SecureRandom random = new SecureRandom();

    public OtpEmailService(
            PasswordResetOtpRepository otpRepository,
            @Autowired(required = false) JavaMailSender mailSender) {
        this.otpRepository = otpRepository;
        this.mailSender = mailSender;
    }

    @Transactional
    public String generateAndSendOtp(String email) {
        // Generate 6-digit numeric OTP
        String otp = String.format("%06d", random.nextInt(1_000_000));

        // Expire in 15 minutes
        LocalDateTime expiry = LocalDateTime.now().plusMinutes(15);

        PasswordResetOtp resetOtp = PasswordResetOtp.builder()
                .email(email.toLowerCase().trim())
                .otp(otp)
                .expiryTime(expiry)
                .used(false)
                .build();

        otpRepository.save(resetOtp);

        // Attempt to send email if SMTP is configured
        boolean emailSent = false;
        if (mailSender != null) {
            try {
                SimpleMailMessage message = new SimpleMailMessage();
                message.setTo(email);
                message.setSubject("Password Reset OTP - Smart Municipal Property Tax Management");
                message.setText("Dear Citizen/User,\n\n"
                        + "Your OTP for password reset is: " + otp + "\n\n"
                        + "This OTP is valid for 15 minutes. If you did not request this, please ignore this email.\n\n"
                        + "Regards,\nMunicipal Corporation Revenue Operations");
                mailSender.send(message);
                emailSent = true;
                log.info("Password reset OTP email sent successfully to {}", email);
            } catch (Exception ex) {
                log.warn("SMTP email sending not available or failed for {}: {}. Falling back to console logging.", email, ex.getMessage());
            }
        }

        // College demonstration fallback: Print OTP to backend console so demo testing never fails
        System.out.println("\n============================================================");
        System.out.println(">>> [COLLEGE DEMO / DEV CONSOLE] PASSWORD RESET OTP <<<");
        System.out.println("PASSWORD RESET OTP FOR " + email + " : " + otp);
        System.out.println("Valid for: 15 minutes | Status: " + (emailSent ? "Email Sent & Logged" : "Console Fallback Active"));
        System.out.println("============================================================\n");

        return otp;
    }
}
