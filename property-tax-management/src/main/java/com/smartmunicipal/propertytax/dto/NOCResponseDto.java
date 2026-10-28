package com.smartmunicipal.propertytax.dto;

import lombok.*;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class NOCResponseDto {

    private Long id;
    private Long propertyId;
    private String propertyIdentifier;
    private Long requestedById;
    private String requestedByName;
    private Long issuedById;
    private String issuedByName;
    private String status;
    private LocalDateTime requestDate;
    private LocalDateTime issueDate;
    private String remarks;
}
