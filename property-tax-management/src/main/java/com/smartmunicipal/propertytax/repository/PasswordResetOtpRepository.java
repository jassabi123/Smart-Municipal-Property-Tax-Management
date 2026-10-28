package com.smartmunicipal.propertytax.repository;

import com.smartmunicipal.propertytax.entity.PasswordResetOtp;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface PasswordResetOtpRepository extends JpaRepository<PasswordResetOtp, Long> {

    Optional<PasswordResetOtp> findTopByEmailAndUsedFalseOrderByCreatedDateDesc(String email);

    Optional<PasswordResetOtp> findTopByEmailAndOtpAndUsedFalseOrderByCreatedDateDesc(String email, String otp);
}
