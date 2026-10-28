package com.smartmunicipal.propertytax.controller;

import com.smartmunicipal.propertytax.dto.TaxAssessmentResponse;
import com.smartmunicipal.propertytax.entity.User;
import com.smartmunicipal.propertytax.repository.UserRepository;
import com.smartmunicipal.propertytax.service.AnalyticsService;
import com.smartmunicipal.propertytax.service.TaxAssessmentService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequiredArgsConstructor
@SecurityRequirement(name = "bearerAuth")
@Tag(name = "Analytics", description = "Role-based collection analytics, charts, and metrics")
public class AnalyticsController {

    private final AnalyticsService analyticsService;
    private final TaxAssessmentService assessmentService;
    private final UserRepository userRepository;

    @GetMapping("/api/analytics/dashboard")
    @Operation(summary = "Get role-specific dashboard metrics")
    public ResponseEntity<Map<String, Object>> getDashboard(Authentication auth) {
        String role = extractRole(auth);
        Long userId = currentUserId(auth);
        return ResponseEntity.ok(analyticsService.getDashboardStats(role, userId));
    }

    @GetMapping("/api/analytics/revenue-trend")
    @Operation(summary = "Revenue trend by date/month")
    public ResponseEntity<List<Map<String, Object>>> getRevenueTrend(
            @RequestParam(required = false) String startDate,
            @RequestParam(required = false) String endDate,
            @RequestParam(required = false) String wardNo) {
        return ResponseEntity.ok(analyticsService.getRevenueTrend(startDate, endDate, wardNo));
    }

    @GetMapping("/api/analytics/monthly-collection")
    @Operation(summary = "Monthly collection breakdown")
    public ResponseEntity<List<Map<String, Object>>> getMonthlyCollection(
            @RequestParam(required = false) String financialYear) {
        return ResponseEntity.ok(analyticsService.getMonthlyCollection(financialYear));
    }

    @GetMapping("/api/analytics/property-distribution")
    @Operation(summary = "Property distribution by construction type")
    public ResponseEntity<List<Map<String, Object>>> getPropertyDistribution(
            @RequestParam(required = false) String wardNo) {
        return ResponseEntity.ok(analyticsService.getPropertyDistribution(wardNo));
    }

    @GetMapping("/api/analytics/property-status")
    @Operation(summary = "Property counts by status")
    public ResponseEntity<List<Map<String, Object>>> getPropertyStatus(
            @RequestParam(required = false) String wardNo) {
        return ResponseEntity.ok(analyticsService.getPropertyStatus(wardNo));
    }

    @GetMapping("/api/analytics/assessment-status")
    @Operation(summary = "Assessment counts by status (scoped to owner if owner role)")
    public ResponseEntity<List<Map<String, Object>>> getAssessmentStatus(Authentication auth) {
        Long ownerId = isOwner(auth) ? currentUserId(auth) : null;
        return ResponseEntity.ok(analyticsService.getAssessmentStatus(ownerId));
    }

    @GetMapping("/api/analytics/payment-modes")
    @Operation(summary = "Payment distribution by mode (UPI, Card, Net Banking, Cash, DD)")
    public ResponseEntity<List<Map<String, Object>>> getPaymentModes() {
        return ResponseEntity.ok(analyticsService.getPaymentModes());
    }

    @GetMapping("/api/analytics/ward-performance")
    @Operation(summary = "Performance comparison across wards")
    public ResponseEntity<List<Map<String, Object>>> getWardPerformance() {
        return ResponseEntity.ok(analyticsService.getWardPerformance());
    }

    @GetMapping("/api/analytics/defaulters")
    @Operation(summary = "Top municipal tax defaulters table")
    public ResponseEntity<List<Map<String, Object>>> getDefaulters(
            @RequestParam(required = false, defaultValue = "10") int limit) {
        return ResponseEntity.ok(analyticsService.getDefaultersTable(limit));
    }

    @GetMapping("/api/analytics/users-by-role")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "User distribution by role (ADMIN only)")
    public ResponseEntity<List<Map<String, Object>>> getUsersByRole() {
        return ResponseEntity.ok(analyticsService.getUsersByRole());
    }

    @GetMapping("/api/analytics/system-activity")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "System activity counts grouped by action (ADMIN only)")
    public ResponseEntity<List<Map<String, Object>>> getSystemActivity() {
        return ResponseEntity.ok(analyticsService.getSystemActivity());
    }

    @GetMapping("/api/analytics/monthly-registrations")
    @Operation(summary = "Monthly property registrations")
    public ResponseEntity<List<Map<String, Object>>> getMonthlyRegistrations(
            @RequestParam(required = false) String wardNo) {
        return ResponseEntity.ok(analyticsService.getMonthlyRegistrations(wardNo));
    }

    @GetMapping("/api/analytics/assessment-trend")
    @Operation(summary = "Assessment trend over financial years")
    public ResponseEntity<List<Map<String, Object>>> getAssessmentTrend() {
        return ResponseEntity.ok(analyticsService.getAssessmentTrend());
    }

    @GetMapping("/api/analytics/tax-by-property-type")
    @Operation(summary = "Tax amount aggregated by property type")
    public ResponseEntity<List<Map<String, Object>>> getTaxByPropertyType() {
        return ResponseEntity.ok(analyticsService.getTaxByPropertyType());
    }

    @GetMapping("/api/analytics/owner/summary")
    @Operation(summary = "Summary metrics for logged-in property owner")
    public ResponseEntity<Map<String, Object>> getOwnerSummary(Authentication auth) {
        return ResponseEntity.ok(analyticsService.getOwnerSummary(currentUserId(auth)));
    }

    @GetMapping("/api/analytics/owner/payment-history")
    @Operation(summary = "Monthly payment history for logged-in property owner")
    public ResponseEntity<List<Map<String, Object>>> getOwnerPaymentHistory(Authentication auth) {
        return ResponseEntity.ok(analyticsService.getOwnerPaymentHistory(currentUserId(auth)));
    }

    @GetMapping("/api/analytics/owner/tax-due-vs-paid")
    @Operation(summary = "Total tax due vs paid for logged-in property owner")
    public ResponseEntity<Map<String, Object>> getOwnerDueVsPaid(Authentication auth) {
        return ResponseEntity.ok(analyticsService.getOwnerDueVsPaid(currentUserId(auth)));
    }

    @GetMapping("/api/analytics/collection")
    @Operation(summary = "Collection efficiency summary")
    public ResponseEntity<Map<String, Object>> getCollectionSummary() {
        return ResponseEntity.ok(analyticsService.getCollectionSummary());
    }

    @GetMapping("/api/defaulters/list")
    @Operation(summary = "List all defaulted tax assessments")
    public ResponseEntity<List<TaxAssessmentResponse>> getDefaultersList() {
        return ResponseEntity.ok(assessmentService.findDefaulters());
    }

    private boolean isOwner(Authentication auth) {
        return auth != null && auth.getAuthorities().stream()
                .anyMatch(a -> "ROLE_PROPERTY_OWNER".equals(a.getAuthority()));
    }

    private String extractRole(Authentication auth) {
        if (auth == null) return "GUEST";
        return auth.getAuthorities().stream()
                .map(a -> a.getAuthority().replace("ROLE_", ""))
                .findFirst().orElse("GUEST");
    }

    private Long currentUserId(Authentication authentication) {
        if (authentication == null) return null;
        return userRepository.findByEmail(authentication.getName())
                .map(User::getId).orElse(null);
    }
}
