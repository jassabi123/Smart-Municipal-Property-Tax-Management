package com.smartmunicipal.propertytax.dto;

import com.smartmunicipal.propertytax.enums.Role;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class AuthResponse {

    private String token;
    private Long userId;
    private String name;
    private String email;
    private Role role;
}
