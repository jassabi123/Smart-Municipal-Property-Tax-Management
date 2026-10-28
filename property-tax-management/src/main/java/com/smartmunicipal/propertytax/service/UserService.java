package com.smartmunicipal.propertytax.service;

import com.smartmunicipal.propertytax.dto.RegisterRequest;
import com.smartmunicipal.propertytax.dto.UserResponse;

import java.util.List;

public interface UserService {

    UserResponse register(RegisterRequest request);

    UserResponse findById(Long id);

    UserResponse findByEmail(String email);

    List<UserResponse> findAll();

    UserResponse updateActiveStatus(Long id, boolean isActive);

    UserResponse updateProfile(String email, String name, String phoneNumber);

    UserResponse updateRole(Long id, com.smartmunicipal.propertytax.enums.Role role);

    UserResponse createUser(RegisterRequest request);
}
