package com.smartmunicipal.propertytax.dto;

import lombok.*;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class NoticeResponse {

    private Long id;
    private Long propertyId;
    private String propertyIdentifier;
    private Long issuedById;
    private String issuedByName;
    private String noticeType;
    private String message;
    private LocalDateTime issuedDate;
    private String status;
}
