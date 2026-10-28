package com.smartmunicipal.propertytax.dto;

import com.fasterxml.jackson.annotation.JsonAlias;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class NoticeRequest {

    @NotNull(message = "Property ID is required")
    @JsonAlias({"property_id", "property"})
    private Long propertyId;

    @JsonAlias({"issuedBy", "userId", "officerId", "createdBy", "issued_by", "user_id", "officer_id", "created_by"})
    private Long issuedById;

    @NotBlank(message = "Notice type is required")
    @JsonAlias({"notice_type", "type"})
    private String noticeType;

    @NotBlank(message = "Message is required")
    @JsonAlias({"description", "content"})
    private String message;
}
