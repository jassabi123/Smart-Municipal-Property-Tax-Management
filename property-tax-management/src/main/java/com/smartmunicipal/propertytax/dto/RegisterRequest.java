package com.smartmunicipal.propertytax.dto;

import com.smartmunicipal.propertytax.enums.Role;
import jakarta.validation.constraints.*;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class RegisterRequest {

    @NotBlank(message = "Name is required")
    @Pattern(regexp = "^[a-zA-Z ]{2,100}$", message = "Name must not contain numbers or special characters")
    private String name;

    @NotBlank(message = "Phone Number is required")
    @Pattern(regexp = "^\\d{10}$", message = "Phone Number must be exactly 10 digits long")
    private String phoneNumber;

    @NotBlank(message = "Email is required")
    @Email(message = "Please enter a valid email address")
    private String email;

    @NotBlank(message = "Password is required")
    @Pattern(
        regexp = "^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[^a-zA-Z\\d]).{8,}$",
        message = "Password must meet security requirements"
    )
    private String password;

    @NotNull(message = "Role is required")
    private Role role;
}
