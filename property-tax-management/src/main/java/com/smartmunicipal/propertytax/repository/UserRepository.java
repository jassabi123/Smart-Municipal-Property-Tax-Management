package com.smartmunicipal.propertytax.repository;

import com.smartmunicipal.propertytax.entity.User;
import com.smartmunicipal.propertytax.enums.Role;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {

    // Authentication — SRS FR1: multi-credential login by email
    Optional<User> findByEmail(String email);

    // Duplicate check — SRS FR1: email uniqueness before registration
    boolean existsByEmail(String email);

    // Duplicate check — SRS FR1: phone uniqueness before registration
    boolean existsByPhoneNumber(String phoneNumber);

    // Admin user management — SRS FR16: user lifecycle management
    List<User> findByRole(Role role);

    // Active user filter — SRS FR16: suspension/deactivation support
    List<User> findByIsActive(Boolean isActive);

    // Combined lookup for active users by role — SRS FR3: RBAC scope
    List<User> findByRoleAndIsActive(Role role, Boolean isActive);
}
