package com.smartmunicipal.propertytax.service;

import com.smartmunicipal.propertytax.dto.NotificationResponse;

import java.util.List;

public interface NotificationService {

    NotificationResponse createNotification(Long recipientId, String channel, String eventType, String message);

    List<NotificationResponse> findByRecipientId(Long recipientId);

    List<NotificationResponse> findUnreadByRecipientId(Long recipientId);

    NotificationResponse markAsRead(Long notificationId);
}
