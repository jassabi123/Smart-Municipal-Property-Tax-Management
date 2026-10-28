package com.smartmunicipal.propertytax.dto;

import jakarta.validation.constraints.NotNull;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class NOCRequestDto {

    @NotNull(message = "Property ID is required")
    private Long propertyId;

    @NotNull(message = "Requester user ID is required")
    private Long requestedById;
}
