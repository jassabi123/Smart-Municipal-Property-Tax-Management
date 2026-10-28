package com.smartmunicipal.propertytax.controller;

import com.smartmunicipal.propertytax.dto.NotificationResponse;
import com.smartmunicipal.propertytax.service.NotificationService;
import com.smartmunicipal.propertytax.service.UserService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/notifications")
@RequiredArgsConstructor
@SecurityRequirement(name = "bearerAuth")
@Tag(name = "Notifications", description = "User notification inbox")
public class NotificationController {

    private final NotificationService notificationService;
    private final UserService userService;

    @GetMapping
    @Operation(summary = "Get own notification inbox")
    public ResponseEntity<List<NotificationResponse>> getMyNotifications(
            @AuthenticationPrincipal UserDetails userDetails) {
        Long userId = userService.findByEmail(userDetails.getUsername()).getId();
        return ResponseEntity.ok(notificationService.findByRecipientId(userId));
    }

    @GetMapping("/unread")
    @Operation(summary = "Get unread notifications")
    public ResponseEntity<List<NotificationResponse>> getUnread(
            @AuthenticationPrincipal UserDetails userDetails) {
        Long userId = userService.findByEmail(userDetails.getUsername()).getId();
        return ResponseEntity.ok(notificationService.findUnreadByRecipientId(userId));
    }

    @PutMapping("/{id}/read")
    @Operation(summary = "Mark a notification as read")
    public ResponseEntity<NotificationResponse> markAsRead(@PathVariable Long id) {
        return ResponseEntity.ok(notificationService.markAsRead(id));
    }
}
