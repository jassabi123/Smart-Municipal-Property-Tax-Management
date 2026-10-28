package com.smartmunicipal.propertytax.dto;

import lombok.*;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class NotificationResponse {

    private Long id;
    private Long recipientId;
    private String channel;
    private String eventType;
    private String message;
    private String deliveryStatus;
    private Boolean isRead;
    private LocalDateTime createdAt;
}
