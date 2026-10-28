package com.smartmunicipal.propertytax.service.impl;

import com.smartmunicipal.propertytax.dto.RegisterRequest;
import com.smartmunicipal.propertytax.dto.UserResponse;
import com.smartmunicipal.propertytax.entity.User;
import com.smartmunicipal.propertytax.exception.InvalidNameException;
import com.smartmunicipal.propertytax.exception.InvalidPhoneException;
import com.smartmunicipal.propertytax.exception.ResourceNotFoundException;
import com.smartmunicipal.propertytax.enums.Role;
import com.smartmunicipal.propertytax.repository.UserRepository;
import com.smartmunicipal.propertytax.service.AuditLogService;
import com.smartmunicipal.propertytax.service.UserService;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class UserServiceImpl implements UserService {

    private static final Logger log = LoggerFactory.getLogger(UserServiceImpl.class);

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuditLogService auditLogService;

    @Override
    @Transactional
    public UserResponse register(RegisterRequest request) {
        if (!request.getName().matches("^[a-zA-Z ]{2,100}$")) {
            throw new InvalidNameException("Name must not contain numbers or special characters");
        }
        if (!request.getPhoneNumber().matches("^\\d{10}$")) {
            throw new InvalidPhoneException("Phone Number must be exactly 10 digits long");
        }
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new IllegalArgumentException("This email is already registered");
        }
        if (userRepository.existsByPhoneNumber(request.getPhoneNumber())) {
            throw new IllegalArgumentException("This phone number is already registered");
        }

        User user = User.builder()
                .name(request.getName())
                .phoneNumber(request.getPhoneNumber())
                .email(request.getEmail())
                .passwordHash(passwordEncoder.encode(request.getPassword()))
                .role(Role.PROPERTY_OWNER)
                .isActive(true)
                .build();

        User saved = userRepository.save(user);
        // FR16: user lifecycle — registration logged; no authenticated actor yet (self-registration)
        // Wrapped in try-catch: REQUIRES_NEW audit failure must not roll back the outer transaction
        try {
            auditLogService.log(null, "CREATE", "User", saved.getId(),
                    "User registered: " + saved.getEmail() + " role=" + saved.getRole(), null);
        } catch (Exception auditEx) {
            log.warn("Audit log failed for User register id={}: {}", saved.getId(), auditEx.getMessage());
        }
        return toResponse(saved);
    }

    @Override
    public UserResponse findById(Long id) {
        return toResponse(getUserOrThrow(id));
    }

    @Override
    public UserResponse findByEmail(String email) {
        return toResponse(userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with email: " + email)));
    }

    @Override
    public List<UserResponse> findAll() {
        return userRepository.findAll().stream().map(u -> UserServiceImpl.toResponse(u)).collect(Collectors.toList());
    }

    @Override
    @Transactional
    public UserResponse updateActiveStatus(Long id, boolean isActive) {
        User user = getUserOrThrow(id);
        user.setIsActive(isActive);
        User saved = userRepository.save(user);
        // FR16: user lifecycle — activation/deactivation logged with admin identity
        Long actorId = resolveCurrentUserId();
        String action = isActive ? "ACTIVATE" : "DEACTIVATE";
        try {
            auditLogService.log(actorId, action, "User", saved.getId(),
                    "User " + action.toLowerCase() + "d: " + saved.getEmail(), null);
        } catch (Exception auditEx) {
            log.warn("Audit log failed for User {} id={}: {}", action, saved.getId(), auditEx.getMessage());
        }
        return toResponse(saved);
    }

    @Override
    @Transactional
    public UserResponse updateProfile(String email, String name, String phoneNumber) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with email: " + email));
        if (name != null && !name.isBlank()) user.setName(name);
        if (phoneNumber != null && !phoneNumber.isBlank()) user.setPhoneNumber(phoneNumber);
        User saved = userRepository.save(user);
        try {
            auditLogService.log(user.getId(), "UPDATE_PROFILE", "User", user.getId(), "Updated profile for " + email, null);
        } catch (Exception ignored) {}
        return toResponse(saved);
    }

    @Override
    @Transactional
    public UserResponse updateRole(Long id, com.smartmunicipal.propertytax.enums.Role role) {
        User user = getUserOrThrow(id);
        user.setRole(role);
        User saved = userRepository.save(user);
        try {
            auditLogService.log(resolveCurrentUserId(), "UPDATE_ROLE", "User", id, "Changed role to " + role + " for " + user.getEmail(), null);
        } catch (Exception ignored) {}
        return toResponse(saved);
    }

    @Override
    @Transactional
    public UserResponse createUser(RegisterRequest request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new IllegalArgumentException("This email is already registered: " + request.getEmail());
        }
        User user = User.builder()
                .name(request.getName())
                .email(request.getEmail())
                .phoneNumber(request.getPhoneNumber())
                .passwordHash(passwordEncoder.encode(request.getPassword()))
                .role(request.getRole() != null ? request.getRole() : com.smartmunicipal.propertytax.enums.Role.PROPERTY_OWNER)
                .isActive(true)
                .build();
        User saved = userRepository.save(user);
        try {
            auditLogService.log(resolveCurrentUserId(), "CREATE_USER", "User", saved.getId(), "Admin created user: " + saved.getEmail() + " (" + saved.getRole() + ")", null);
        } catch (Exception ignored) {}
        return toResponse(saved);
    }

    private Long resolveCurrentUserId() {
        var auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated()) return null;
        return userRepository.findByEmail(auth.getName()).map(User::getId).orElse(null);
    }

    private User getUserOrThrow(Long id) {
        return userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + id));
    }

    public static UserResponse toResponse(User user) {
        return new UserResponse(
                user.getId(),
                user.getName(),
                user.getPhoneNumber(),
                user.getEmail(),
                user.getRole(),
                user.getCreatedDate(),
                user.getLastLogin(),
                user.getIsActive()
        );
    }
}
