package com.smartmunicipal.propertytax.service;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

public interface AnalyticsService {

    BigDecimal getTotalTaxAssessed();

    BigDecimal getTotalTaxCollected();

    BigDecimal getTotalPendingAmount();

    long getTotalPropertyCount();

    long getDefaulterCount();

    Map<String, Object> getCollectionSummary();

    Map<String, Object> getDashboardStats(String role, Long userId);

    List<Map<String, Object>> getRevenueTrend(String startDate, String endDate, String wardNo);

    List<Map<String, Object>> getMonthlyCollection(String financialYear);

    List<Map<String, Object>> getPropertyDistribution(String wardNo);

    List<Map<String, Object>> getPropertyStatus(String wardNo);

    List<Map<String, Object>> getAssessmentStatus(Long ownerId);

    List<Map<String, Object>> getPaymentModes();

    List<Map<String, Object>> getWardPerformance();

    List<Map<String, Object>> getDefaultersTable(int limit);

    List<Map<String, Object>> getUsersByRole();

    List<Map<String, Object>> getSystemActivity();

    List<Map<String, Object>> getMonthlyRegistrations(String wardNo);

    List<Map<String, Object>> getAssessmentTrend();

    List<Map<String, Object>> getTaxByPropertyType();

    Map<String, Object> getOwnerSummary(Long ownerId);

    List<Map<String, Object>> getOwnerPaymentHistory(Long ownerId);

    Map<String, Object> getOwnerDueVsPaid(Long ownerId);
}

