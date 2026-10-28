package com.smartmunicipal.propertytax.repository;

import com.smartmunicipal.propertytax.entity.Notification;
import com.smartmunicipal.propertytax.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface NotificationRepository extends JpaRepository<Notification, Long> {

    // All notifications for a user — SRS FR8: user notification inbox
    List<Notification> findByRecipientOrderByCreatedAtDesc(User recipient);

    // Notifications by recipient ID — SRS FR8: user-scoped notification fetch
    List<Notification> findByRecipientIdOrderByCreatedAtDesc(Long recipientId);

    // Unread notifications — SRS FR8: unread count and inbox display
    List<Notification> findByRecipientIdAndIsRead(Long recipientId, Boolean isRead);

    // Notifications by delivery status — SRS FR8: retry for FAILED deliveries
    List<Notification> findByDeliveryStatus(String deliveryStatus);

    // Notifications by channel — SRS FR8: IN_APP, EMAIL, SMS channel filtering
    List<Notification> findByRecipientIdAndChannel(Long recipientId, String channel);

    // Notifications by event type — SRS FR8: event-triggered notification lookup
    List<Notification> findByEventType(String eventType);
}
