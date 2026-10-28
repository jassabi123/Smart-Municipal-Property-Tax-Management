package com.smartmunicipal.propertytax.service.impl;

import com.smartmunicipal.propertytax.dto.NotificationResponse;
import com.smartmunicipal.propertytax.entity.Notification;
import com.smartmunicipal.propertytax.entity.User;
import com.smartmunicipal.propertytax.exception.ResourceNotFoundException;
import com.smartmunicipal.propertytax.repository.NotificationRepository;
import com.smartmunicipal.propertytax.repository.UserRepository;
import com.smartmunicipal.propertytax.service.AuditLogService;
import com.smartmunicipal.propertytax.service.NotificationService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class NotificationServiceImpl implements NotificationService {

    private final NotificationRepository notificationRepository;
    private final UserRepository userRepository;
    private final AuditLogService auditLogService;

    @Override
    @Transactional
    public NotificationResponse createNotification(Long recipientId, String channel, String eventType, String message) {
        User recipient = userRepository.findById(recipientId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + recipientId));

        Notification notification = Notification.builder()
                .recipient(recipient)
                .channel(channel)
                .eventType(eventType)
                .message(message)
                .deliveryStatus("PENDING")
                .isRead(false)
                .build();

        return toResponse(notificationRepository.save(notification));
    }

    @Override
    @Transactional(readOnly = true)
    public List<NotificationResponse> findByRecipientId(Long recipientId) {
        return notificationRepository.findByRecipientIdOrderByCreatedAtDesc(recipientId)
                .stream().map(n -> NotificationServiceImpl.toResponse(n)).collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<NotificationResponse> findUnreadByRecipientId(Long recipientId) {
        return notificationRepository.findByRecipientIdAndIsRead(recipientId, false)
                .stream().map(n -> NotificationServiceImpl.toResponse(n)).collect(Collectors.toList());
    }

    @Override
    @Transactional
    public NotificationResponse markAsRead(Long notificationId) {
        Notification notification = notificationRepository.findById(notificationId)
                .orElseThrow(() -> new ResourceNotFoundException("Notification not found with id: " + notificationId));

        Long performedById = resolveCurrentUserId();
        if (performedById == null || notification.getRecipient() == null || !performedById.equals(notification.getRecipient().getId())) {
            throw new AccessDeniedException("You can only update your own notifications.");
        }

        notification.setIsRead(true);
        Notification saved = notificationRepository.save(notification);

        // FR16: notification read-status change logged
        auditLogService.log(
                performedById,
                "UPDATE",
                "Notification",
                saved.getId(),
                "Notification marked as read: recipient="
                        + saved.getRecipient().getId()
                        + " eventType="
                        + saved.getEventType(),
                null
        );

        return toResponse(saved);
    }

    private Long resolveCurrentUserId() {
        var auth = SecurityContextHolder
                .getContext()
                .getAuthentication();

        if (auth == null || !auth.isAuthenticated()) {
            return null;
        }

        return userRepository
                .findByEmail(auth.getName())
                .map(User::getId)
                .orElse(null);
    }

    public static NotificationResponse toResponse(Notification n) {
        return new NotificationResponse(
                n.getId(),
                n.getRecipient().getId(),
                n.getChannel(),
                n.getEventType(),
                n.getMessage(),
                n.getDeliveryStatus(),
                n.getIsRead(),
                n.getCreatedAt()
        );
    }
}