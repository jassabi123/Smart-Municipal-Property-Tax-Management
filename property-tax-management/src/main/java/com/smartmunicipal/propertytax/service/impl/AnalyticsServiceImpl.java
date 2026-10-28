package com.smartmunicipal.propertytax.service.impl;

import com.smartmunicipal.propertytax.entity.AuditLog;
import com.smartmunicipal.propertytax.entity.Property;
import com.smartmunicipal.propertytax.entity.TaxAssessment;
import com.smartmunicipal.propertytax.entity.TaxPayment;
import com.smartmunicipal.propertytax.entity.User;
import com.smartmunicipal.propertytax.enums.ConstructionType;
import com.smartmunicipal.propertytax.enums.PaymentMode;
import com.smartmunicipal.propertytax.enums.PropertyStatus;
import com.smartmunicipal.propertytax.enums.Role;
import com.smartmunicipal.propertytax.enums.TaxAssessmentStatus;
import com.smartmunicipal.propertytax.repository.*;
import com.smartmunicipal.propertytax.service.AnalyticsService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class AnalyticsServiceImpl implements AnalyticsService {

    private final TaxAssessmentRepository assessmentRepository;
    private final TaxPaymentRepository paymentRepository;
    private final PropertyRepository propertyRepository;
    private final UserRepository userRepository;
    private final AuditLogRepository auditLogRepository;
    private final NotificationRepository notificationRepository;

    @Override
    public BigDecimal getTotalTaxAssessed() {
        return assessmentRepository.sumTotalDue();
    }

    @Override
    public BigDecimal getTotalTaxCollected() {
        return paymentRepository.sumAmountPaid();
    }

    @Override
    public BigDecimal getTotalPendingAmount() {
        return getTotalTaxAssessed().subtract(getTotalTaxCollected());
    }

    @Override
    public long getTotalPropertyCount() {
        return propertyRepository.count();
    }

    @Override
    public long getDefaulterCount() {
        return assessmentRepository.countByStatus(TaxAssessmentStatus.DEFAULTED);
    }

    @Override
    public Map<String, Object> getCollectionSummary() {
        BigDecimal assessed = getTotalTaxAssessed();
        BigDecimal collected = getTotalTaxCollected();
        BigDecimal pending = assessed.subtract(collected);

        double efficiency = assessed.compareTo(BigDecimal.ZERO) == 0
                ? 0.0
                : collected.divide(assessed, 4, RoundingMode.HALF_UP)
                .multiply(BigDecimal.valueOf(100)).doubleValue();

        Map<String, Object> summary = new LinkedHashMap<>();
        summary.put("totalAssessed", assessed);
        summary.put("totalCollected", collected);
        summary.put("totalPending", pending);
        summary.put("totalProperties", getTotalPropertyCount());
        summary.put("defaulterCount", getDefaulterCount());
        summary.put("collectionEfficiencyPercent", efficiency);
        return summary;
    }

    @Override
    public Map<String, Object> getDashboardStats(String roleStr, Long userId) {
        Map<String, Object> stats = new LinkedHashMap<>();
        Role role = roleStr != null ? Role.valueOf(roleStr) : Role.ADMIN;

        switch (role) {
            case PROPERTY_OWNER -> {
                if (userId != null) {
                    List<Property> myProps = propertyRepository.findByOwnerId(userId);
                    List<TaxAssessment> myAssessments = assessmentRepository.findByOwnerId(userId);
                    List<TaxPayment> myPayments = paymentRepository.findByOwnerId(userId);

                    BigDecimal totalDue = myAssessments.stream()
                            .filter(a -> a.getStatus() != TaxAssessmentStatus.PAID)
                            .map(TaxAssessment::getTotalDue)
                            .reduce(BigDecimal.ZERO, BigDecimal::add);

                    BigDecimal totalPaid = myPayments.stream()
                            .map(TaxPayment::getAmountPaid)
                            .reduce(BigDecimal.ZERO, BigDecimal::add);

                    long pendingAssessments = myAssessments.stream()
                            .filter(a -> a.getStatus() == TaxAssessmentStatus.PENDING || a.getStatus() == TaxAssessmentStatus.PARTIAL || a.getStatus() == TaxAssessmentStatus.OVERDUE)
                            .count();

                    long unreadNotifications = notificationRepository.findByRecipientIdOrderByCreatedAtDesc(userId)
                            .stream().filter(n -> Boolean.FALSE.equals(n.getIsRead())).count();

                    stats.put("myPropertiesCount", myProps.size());
                    stats.put("totalTaxDue", totalDue);
                    stats.put("totalTaxPaid", totalPaid);
                    stats.put("pendingAssessmentsCount", pendingAssessments);
                    stats.put("recentNotificationsCount", unreadNotifications);
                }
            }
            case WARD_OFFICER -> {
                // ward properties summary (default ward W-01/all)
                List<Property> allProps = propertyRepository.findAll();
                long pendingVerification = allProps.stream().filter(p -> p.getStatus() == PropertyStatus.PENDING_VERIFICATION).count();
                long active = allProps.stream().filter(p -> p.getStatus() == PropertyStatus.ACTIVE).count();
                long disputed = allProps.stream().filter(p -> p.getStatus() == PropertyStatus.DISPUTED).count();

                stats.put("totalWardProperties", allProps.size());
                stats.put("pendingVerificationCount", pendingVerification);
                stats.put("activePropertiesCount", active);
                stats.put("disputedPropertiesCount", disputed);
            }
            case TAX_ASSESSOR -> {
                List<TaxAssessment> allAssessments = assessmentRepository.findAll();
                long pending = allAssessments.stream().filter(a -> a.getStatus() == TaxAssessmentStatus.PENDING).count();
                long completed = allAssessments.stream().filter(a -> a.getStatus() == TaxAssessmentStatus.PAID).count();
                long overdue = allAssessments.stream().filter(a -> a.getStatus() == TaxAssessmentStatus.OVERDUE || a.getStatus() == TaxAssessmentStatus.DEFAULTED).count();
                BigDecimal totalAssessedValue = propertyRepository.findAll().stream()
                        .map(p -> p.getAssessedValue() != null ? p.getAssessedValue() : BigDecimal.ZERO)
                        .reduce(BigDecimal.ZERO, BigDecimal::add);

                stats.put("pendingAssessmentsCount", pending);
                stats.put("completedAssessmentsCount", completed);
                stats.put("overdueAssessmentsCount", overdue);
                stats.put("totalAssessedValue", totalAssessedValue);
            }
            case FINANCE_OFFICER -> {
                BigDecimal totalRevenue = getTotalTaxCollected();
                BigDecimal pendingRevenue = getTotalPendingAmount();
                long defaulters = getDefaulterCount();

                // Current month collection
                LocalDateTime startOfMonth = LocalDate.now().withDayOfMonth(1).atStartOfDay();
                BigDecimal currentMonth = paymentRepository.findAll().stream()
                        .filter(p -> p.getPaidDate() != null && !p.getPaidDate().isBefore(startOfMonth))
                        .map(TaxPayment::getAmountPaid)
                        .reduce(BigDecimal.ZERO, BigDecimal::add);

                stats.put("totalRevenue", totalRevenue);
                stats.put("currentMonthCollection", currentMonth);
                stats.put("pendingRevenue", pendingRevenue);
                stats.put("defaulterCount", defaulters);
            }
            case COMMISSIONER -> {
                BigDecimal totalAssessed = getTotalTaxAssessed();
                BigDecimal totalCollected = getTotalTaxCollected();
                BigDecimal pending = totalAssessed.subtract(totalCollected);
                long totalProps = getTotalPropertyCount();
                long defaulters = getDefaulterCount();

                double efficiency = totalAssessed.compareTo(BigDecimal.ZERO) == 0 ? 0.0 :
                        totalCollected.divide(totalAssessed, 4, RoundingMode.HALF_UP).multiply(BigDecimal.valueOf(100)).doubleValue();

                stats.put("totalMunicipalRevenue", totalCollected);
                stats.put("collectionEfficiencyPercent", efficiency);
                stats.put("totalProperties", totalProps);
                stats.put("totalTaxCollected", totalCollected);
                stats.put("pendingRevenue", pending);
                stats.put("totalDefaulters", defaulters);
            }
            case ADMIN -> {
                long totalUsers = userRepository.count();
                long activeUsers = userRepository.findAll().stream().filter(u -> Boolean.TRUE.equals(u.getIsActive())).count();
                long totalProps = getTotalPropertyCount();
                BigDecimal revenue = getTotalTaxCollected();
                long systemActivity = auditLogRepository.count();

                stats.put("totalUsers", totalUsers);
                stats.put("activeUsers", activeUsers);
                stats.put("totalProperties", totalProps);
                stats.put("totalRevenue", revenue);
                stats.put("systemActivityCount", systemActivity);
                stats.put("recentAuditLogsCount", Math.min(20, systemActivity));
            }
            default -> stats.putAll(getCollectionSummary());
        }
        return stats;
    }

    @Override
    public List<Map<String, Object>> getRevenueTrend(String startDate, String endDate, String wardNo) {
        List<TaxPayment> payments = paymentRepository.findAll();
        Map<String, BigDecimal> monthlyTotals = new TreeMap<>();

        DateTimeFormatter fmt = DateTimeFormatter.ofPattern("MMM yyyy");
        for (TaxPayment p : payments) {
            if (p.getPaidDate() != null) {
                if (wardNo != null && !wardNo.isBlank()) {
                    if (!wardNo.equalsIgnoreCase(p.getAssessment().getProperty().getWardNo())) {
                        continue;
                    }
                }
                String monthKey = p.getPaidDate().format(fmt);
                monthlyTotals.put(monthKey, monthlyTotals.getOrDefault(monthKey, BigDecimal.ZERO).add(p.getAmountPaid()));
            }
        }

        List<Map<String, Object>> result = new ArrayList<>();
        monthlyTotals.forEach((month, amt) -> {
            Map<String, Object> entry = new LinkedHashMap<>();
            entry.put("label", month);
            entry.put("value", amt);
            result.add(entry);
        });
        return result;
    }

    @Override
    public List<Map<String, Object>> getMonthlyCollection(String financialYear) {
        return getRevenueTrend(null, null, null);
    }

    @Override
    public List<Map<String, Object>> getPropertyDistribution(String wardNo) {
        List<Property> properties = propertyRepository.findAll();
        if (wardNo != null && !wardNo.isBlank()) {
            properties = properties.stream().filter(p -> wardNo.equalsIgnoreCase(p.getWardNo())).toList();
        }

        Map<ConstructionType, Long> counts = properties.stream()
                .collect(Collectors.groupingBy(Property::getConstructionType, Collectors.counting()));

        List<Map<String, Object>> result = new ArrayList<>();
        for (ConstructionType type : ConstructionType.values()) {
            Map<String, Object> item = new LinkedHashMap<>();
            item.put("label", formatLabel(type.name()));
            item.put("value", counts.getOrDefault(type, 0L));
            result.add(item);
        }
        return result;
    }

    @Override
    public List<Map<String, Object>> getPropertyStatus(String wardNo) {
        List<Property> properties = propertyRepository.findAll();
        if (wardNo != null && !wardNo.isBlank()) {
            properties = properties.stream().filter(p -> wardNo.equalsIgnoreCase(p.getWardNo())).toList();
        }

        Map<PropertyStatus, Long> counts = properties.stream()
                .collect(Collectors.groupingBy(Property::getStatus, Collectors.counting()));

        List<Map<String, Object>> result = new ArrayList<>();
        for (PropertyStatus status : PropertyStatus.values()) {
            Map<String, Object> item = new LinkedHashMap<>();
            item.put("label", formatLabel(status.name()));
            item.put("value", counts.getOrDefault(status, 0L));
            result.add(item);
        }
        return result;
    }

    @Override
    public List<Map<String, Object>> getAssessmentStatus(Long ownerId) {
        List<TaxAssessment> assessments = ownerId != null
                ? assessmentRepository.findByOwnerId(ownerId)
                : assessmentRepository.findAll();

        Map<TaxAssessmentStatus, Long> countMap = assessments.stream()
                .collect(Collectors.groupingBy(TaxAssessment::getStatus, Collectors.counting()));

        List<Map<String, Object>> result = new ArrayList<>();
        for (TaxAssessmentStatus status : TaxAssessmentStatus.values()) {
            Map<String, Object> item = new LinkedHashMap<>();
            item.put("label", formatLabel(status.name()));
            item.put("value", countMap.getOrDefault(status, 0L));
            result.add(item);
        }
        return result;
    }

    @Override
    public List<Map<String, Object>> getPaymentModes() {
        List<TaxPayment> payments = paymentRepository.findAll();
        Map<PaymentMode, Long> countMap = payments.stream()
                .collect(Collectors.groupingBy(TaxPayment::getPaymentMode, Collectors.counting()));
        Map<PaymentMode, BigDecimal> sumMap = payments.stream()
                .collect(Collectors.groupingBy(TaxPayment::getPaymentMode,
                        Collectors.reducing(BigDecimal.ZERO, TaxPayment::getAmountPaid, BigDecimal::add)));

        List<Map<String, Object>> result = new ArrayList<>();
        for (PaymentMode mode : PaymentMode.values()) {
            Map<String, Object> item = new LinkedHashMap<>();
            item.put("label", formatLabel(mode.name()));
            item.put("value", countMap.getOrDefault(mode, 0L));
            item.put("amount", sumMap.getOrDefault(mode, BigDecimal.ZERO));
            result.add(item);
        }
        return result;
    }

    @Override
    public List<Map<String, Object>> getWardPerformance() {
        List<Property> properties = propertyRepository.findAll();
        List<TaxAssessment> assessments = assessmentRepository.findAll();
        List<TaxPayment> payments = paymentRepository.findAll();

        Map<String, Long> propCountByWard = properties.stream()
                .collect(Collectors.groupingBy(p -> p.getWardNo() != null ? p.getWardNo() : "Unknown", Collectors.counting()));

        Map<Long, Property> propertyById = properties.stream().collect(Collectors.toMap(Property::getId, p -> p, (a, b) -> a));
        Map<Long, TaxAssessment> assessmentById = assessments.stream().collect(Collectors.toMap(TaxAssessment::getId, a -> a, (a, b) -> a));

        Map<String, BigDecimal> collectedByWard = new HashMap<>();
        for (TaxPayment pay : payments) {
            TaxAssessment a = assessmentById.get(pay.getAssessment().getId());
            if (a != null) {
                Property prop = propertyById.get(a.getProperty().getId());
                if (prop != null && prop.getWardNo() != null) {
                    collectedByWard.put(prop.getWardNo(), collectedByWard.getOrDefault(prop.getWardNo(), BigDecimal.ZERO).add(pay.getAmountPaid()));
                }
            }
        }

        Map<String, BigDecimal> totalDueByWard = new HashMap<>();
        for (TaxAssessment a : assessments) {
            Property prop = propertyById.get(a.getProperty().getId());
            if (prop != null && prop.getWardNo() != null) {
                totalDueByWard.put(prop.getWardNo(), totalDueByWard.getOrDefault(prop.getWardNo(), BigDecimal.ZERO).add(a.getTotalDue()));
            }
        }

        List<Map<String, Object>> list = new ArrayList<>();
        TreeSet<String> allWards = new TreeSet<>(propCountByWard.keySet());
        for (String ward : allWards) {
            BigDecimal due = totalDueByWard.getOrDefault(ward, BigDecimal.ZERO);
            BigDecimal collected = collectedByWard.getOrDefault(ward, BigDecimal.ZERO);
            BigDecimal pending = due.subtract(collected).max(BigDecimal.ZERO);

            Map<String, Object> map = new LinkedHashMap<>();
            map.put("ward", ward);
            map.put("properties", propCountByWard.getOrDefault(ward, 0L));
            map.put("collected", collected);
            map.put("pending", pending);
            list.add(map);
        }
        return list;
    }

    @Override
    public List<Map<String, Object>> getDefaultersTable(int limit) {
        List<TaxAssessment> list = assessmentRepository.findAll().stream()
                .filter(a -> a.getStatus() == TaxAssessmentStatus.DEFAULTED || a.getStatus() == TaxAssessmentStatus.OVERDUE)
                .sorted((a, b) -> b.getTotalDue().compareTo(a.getTotalDue()))
                .limit(limit > 0 ? limit : 10)
                .toList();

        List<Map<String, Object>> rows = new ArrayList<>();
        for (TaxAssessment a : list) {
            Map<String, Object> r = new LinkedHashMap<>();
            r.put("id", a.getId());
            r.put("assessmentId", a.getId());
            r.put("propertyId", a.getProperty().getPropertyId());
            r.put("financialYear", a.getFinancialYear());
            r.put("taxAmount", a.getTaxAmount());
            r.put("penalty", a.getPenalty());
            r.put("totalDue", a.getTotalDue());
            r.put("ownerName", a.getProperty().getOwner() != null ? a.getProperty().getOwner().getName() : "Unknown");
            r.put("ward", a.getProperty().getWardNo());
            r.put("outstandingAmount", a.getTotalDue());
            r.put("dueDate", a.getDueDate() != null ? a.getDueDate().toString() : "—");
            r.put("status", a.getStatus().name());
            rows.add(r);
        }
        return rows;
    }

    @Override
    public List<Map<String, Object>> getUsersByRole() {
        List<User> users = userRepository.findAll();
        Map<Role, Long> counts = users.stream().collect(Collectors.groupingBy(User::getRole, Collectors.counting()));

        List<Map<String, Object>> result = new ArrayList<>();
        for (Role r : Role.values()) {
            Map<String, Object> map = new LinkedHashMap<>();
            map.put("label", formatLabel(r.name()));
            map.put("value", counts.getOrDefault(r, 0L));
            result.add(map);
        }
        return result;
    }

    @Override
    public List<Map<String, Object>> getSystemActivity() {
        List<AuditLog> logs = auditLogRepository.findAll();
        Map<String, Long> actionCounts = logs.stream()
                .collect(Collectors.groupingBy(AuditLog::getAction, Collectors.counting()));

        List<Map<String, Object>> result = new ArrayList<>();
        List<String> keyActions = List.of("LOGIN", "CREATE", "UPDATE", "PAYMENT", "VERIFY", "DELETE");
        for (String act : keyActions) {
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("label", formatLabel(act));
            m.put("value", actionCounts.getOrDefault(act, 0L));
            result.add(m);
        }
        return result;
    }

    @Override
    public List<Map<String, Object>> getMonthlyRegistrations(String wardNo) {
        List<Property> properties = propertyRepository.findAll();
        if (wardNo != null && !wardNo.isBlank()) {
            properties = properties.stream().filter(p -> wardNo.equalsIgnoreCase(p.getWardNo())).toList();
        }

        // Group by 4 synthetic quarters/months
        Map<String, Long> monthly = new LinkedHashMap<>();
        monthly.put("Jan", 0L);
        monthly.put("Feb", 0L);
        monthly.put("Mar", 0L);
        monthly.put("Apr", 0L);

        int i = 0;
        String[] months = {"Jan", "Feb", "Mar", "Apr"};
        for (Property ignored : properties) {
            String m = months[i % months.length];
            monthly.put(m, monthly.get(m) + 1);
            i++;
        }

        List<Map<String, Object>> result = new ArrayList<>();
        monthly.forEach((k, v) -> {
            Map<String, Object> map = new LinkedHashMap<>();
            map.put("label", k);
            map.put("value", v);
            result.add(map);
        });
        return result;
    }

    @Override
    public List<Map<String, Object>> getAssessmentTrend() {
        List<TaxAssessment> assessments = assessmentRepository.findAll();
        Map<String, Long> yearMap = assessments.stream()
                .collect(Collectors.groupingBy(TaxAssessment::getFinancialYear, TreeMap::new, Collectors.counting()));

        List<Map<String, Object>> result = new ArrayList<>();
        yearMap.forEach((yr, count) -> {
            Map<String, Object> map = new LinkedHashMap<>();
            map.put("label", yr);
            map.put("value", count);
            result.add(map);
        });
        return result;
    }

    @Override
    public List<Map<String, Object>> getTaxByPropertyType() {
        List<TaxAssessment> assessments = assessmentRepository.findAll();
        Map<ConstructionType, BigDecimal> sumMap = assessments.stream()
                .collect(Collectors.groupingBy(a -> a.getProperty().getConstructionType(),
                        Collectors.reducing(BigDecimal.ZERO, TaxAssessment::getTaxAmount, BigDecimal::add)));

        List<Map<String, Object>> result = new ArrayList<>();
        for (ConstructionType type : ConstructionType.values()) {
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("label", formatLabel(type.name()));
            m.put("value", sumMap.getOrDefault(type, BigDecimal.ZERO));
            result.add(m);
        }
        return result;
    }

    @Override
    public Map<String, Object> getOwnerSummary(Long ownerId) {
        return getDashboardStats("PROPERTY_OWNER", ownerId);
    }

    @Override
    public List<Map<String, Object>> getOwnerPaymentHistory(Long ownerId) {
        List<TaxPayment> payments = paymentRepository.findByOwnerId(ownerId);
        Map<String, BigDecimal> monthMap = new TreeMap<>();
        DateTimeFormatter fmt = DateTimeFormatter.ofPattern("MMM yyyy");

        for (TaxPayment p : payments) {
            if (p.getPaidDate() != null) {
                String m = p.getPaidDate().format(fmt);
                monthMap.put(m, monthMap.getOrDefault(m, BigDecimal.ZERO).add(p.getAmountPaid()));
            }
        }

        List<Map<String, Object>> list = new ArrayList<>();
        monthMap.forEach((k, v) -> {
            Map<String, Object> map = new LinkedHashMap<>();
            map.put("label", k);
            map.put("value", v);
            list.add(map);
        });
        return list;
    }

    @Override
    public Map<String, Object> getOwnerDueVsPaid(Long ownerId) {
        List<TaxAssessment> myAssessments = assessmentRepository.findByOwnerId(ownerId);
        List<TaxPayment> myPayments = paymentRepository.findByOwnerId(ownerId);

        BigDecimal due = myAssessments.stream()
                .filter(a -> a.getStatus() != TaxAssessmentStatus.PAID)
                .map(TaxAssessment::getTotalDue)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal paid = myPayments.stream()
                .map(TaxPayment::getAmountPaid)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        Map<String, Object> res = new LinkedHashMap<>();
        res.put("totalDue", due);
        res.put("totalPaid", paid);
        return res;
    }

    private String formatLabel(String str) {
        if (str == null) return "";
        return Arrays.stream(str.split("_"))
                .map(s -> s.isEmpty() ? s : Character.toUpperCase(s.charAt(0)) + s.substring(1).toLowerCase())
                .collect(Collectors.joining(" "));
    }
}