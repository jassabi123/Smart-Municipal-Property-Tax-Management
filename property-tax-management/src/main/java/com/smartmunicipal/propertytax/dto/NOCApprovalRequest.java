package com.smartmunicipal.propertytax.dto;

import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class NOCApprovalRequest {

    private Long id;
    private Long officerId;
    private Long approvedById;
    private Long issuedById;
    private String remarks;
    private String status;
    private String action;
}
