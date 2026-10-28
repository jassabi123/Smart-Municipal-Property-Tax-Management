package com.smartmunicipal.propertytax.dto;

import com.smartmunicipal.propertytax.enums.Role;
import lombok.*;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class UserResponse {

    private Long id;
    private String name;
    private String phoneNumber;
    private String email;
    private Role role;
    private LocalDateTime createdDate;
    private LocalDateTime lastLogin;
    private Boolean isActive;
}
