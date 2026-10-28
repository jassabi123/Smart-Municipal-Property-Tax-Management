package com.smartmunicipal.propertytax.config;

import com.smartmunicipal.propertytax.entity.*;
import com.smartmunicipal.propertytax.enums.*;
import com.smartmunicipal.propertytax.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.core.annotation.Order;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.EnumMap;
import java.util.Map;

@Component
@Order(10)
@RequiredArgsConstructor
@ConditionalOnProperty(name = "app.seed-data", havingValue = "true")
public class DevelopmentDataSeeder implements CommandLineRunner {
    private final UserRepository userRepository;
    private final PropertyRepository propertyRepository;
    private final TaxAssessmentRepository assessmentRepository;
    private final TaxPaymentRepository paymentRepository;
    private final ExemptionRepository exemptionRepository;
    private final NOCRequestRepository nocRepository;
    private final NoticeRepository noticeRepository;
    private final NotificationRepository notificationRepository;
    private final GrievanceRepository grievanceRepository;
    private final PasswordEncoder passwordEncoder;

    @Value("${app.seed-password:Demo@1234}")
    private String seedPassword;

    @Override
    @Transactional
    public void run(String... args) {
        Map<Role, User> users = new EnumMap<>(Role.class);
        users.put(Role.PROPERTY_OWNER, user("demo.owner@municipal.local", "Demo Owner", "9000000001", Role.PROPERTY_OWNER));
        users.put(Role.WARD_OFFICER, user("demo.ward@municipal.local", "Demo Ward Officer", "9000000002", Role.WARD_OFFICER));
        users.put(Role.TAX_ASSESSOR, user("demo.assessor@municipal.local", "Demo Tax Assessor", "9000000003", Role.TAX_ASSESSOR));
        users.put(Role.FINANCE_OFFICER, user("demo.finance@municipal.local", "Demo Finance Officer", "9000000004", Role.FINANCE_OFFICER));
        users.put(Role.COMMISSIONER, user("demo.commissioner@municipal.local", "Demo Commissioner", "9000000005", Role.COMMISSIONER));
        users.put(Role.ADMIN, user("demo.admin@municipal.local", "Demo Administrator", "9000000006", Role.ADMIN));
        users.put(Role.GUEST, user("demo.guest@municipal.local", "Demo Guest", "9000000007", Role.GUEST));

        User owner = users.get(Role.PROPERTY_OWNER);
        User assessor = users.get(Role.TAX_ASSESSOR);
        User finance = users.get(Role.FINANCE_OFFICER);
        User ward = users.get(Role.WARD_OFFICER);

        Property home = property("SEED-HOME-001", owner, "14 Green Avenue", "W-01", "RESIDENTIAL", "ACTIVE", "1250", "650000");
        Property shop = property("SEED-SHOP-002", owner, "8 Market Street", "W-02", "COMMERCIAL", "ACTIVE", "2400", "1450000");
        Property pendingProp = property("SEED-VERIF-003", owner, "25 Park Lane", "W-01", "RESIDENTIAL", "PENDING_VERIFICATION", "1600", "820000");
        Property disputedProp = property("SEED-IND-004", owner, "77 Industrial Estate", "W-03", "INDUSTRIAL", "DISPUTED", "5400", "3400000");
        Property exemptProp = property("SEED-VAC-005", owner, "9 Outer Ring Road", "W-04", "VACANT", "EXEMPTED", "3100", "950000");

        TaxAssessment homeAssessment = assessment(home, "2025-26", "18500", "0", TaxAssessmentStatus.PAID, "2026-03-31");
        TaxAssessment shopAssessment = assessment(shop, "2025-26", "62000", "2500", TaxAssessmentStatus.DEFAULTED, "2026-03-31");
        TaxAssessment pendingAssessment = assessment(home, "2024-25", "17200", "0", TaxAssessmentStatus.PAID, "2025-03-31");
        TaxAssessment overdueAssessment = assessment(disputedProp, "2025-26", "45000", "3000", TaxAssessmentStatus.OVERDUE, "2026-01-31");

        if (!paymentRepository.existsByTransactionId("SEED-TXN-HOME-001")) {
            paymentRepository.save(TaxPayment.builder().assessment(homeAssessment).amountPaid(new BigDecimal("18500"))
                    .paymentMode(PaymentMode.UPI).transactionId("SEED-TXN-HOME-001")
                    .paidDate(LocalDateTime.now().minusDays(12)).receiptNo("SEED-RCP-001").build());
        }
        if (!paymentRepository.existsByTransactionId("SEED-TXN-CARD-002")) {
            paymentRepository.save(TaxPayment.builder().assessment(pendingAssessment).amountPaid(new BigDecimal("17200"))
                    .paymentMode(PaymentMode.CARD).transactionId("SEED-TXN-CARD-002")
                    .paidDate(LocalDateTime.now().minusMonths(2)).receiptNo("SEED-RCP-002").build());
        }
        if (exemptionRepository.findByPropertyId(home.getId()).isEmpty()) {
            exemptionRepository.save(Exemption.builder().property(home).exemptionType("SENIOR_CITIZEN")
                    .percentage(new BigDecimal("25")).validFrom(LocalDate.of(2025, 4, 1))
                    .validTo(LocalDate.of(2026, 3, 31)).approvedBy(finance).build());
        }
        if (nocRepository.findByPropertyId(home.getId()).isEmpty()) {
            nocRepository.save(NOCRequest.builder().property(home).requestedBy(owner).status("PENDING").build());
        }
        if (noticeRepository.findByPropertyId(shop.getId()).isEmpty()) {
            noticeRepository.save(Notice.builder().property(shop).issuedBy(ward).noticeType("ARREAR_RECOVERY")
                    .message("Synthetic development notice: outstanding assessment requires review.").status("ISSUED").build());
        }
        if (notificationRepository.findByRecipientIdOrderByCreatedAtDesc(owner.getId()).stream().noneMatch(n -> "SEED-ASSESSMENT".equals(n.getEventType()))) {
            notificationRepository.save(Notification.builder().recipient(owner).channel("IN_APP").eventType("SEED-ASSESSMENT")
                    .message("Synthetic development notification: your 2025-26 home assessment is paid.")
                    .deliveryStatus("DELIVERED").isRead(false).build());
        }
        if (grievanceRepository.findByUserIdOrderByCreatedAtDesc(owner.getId()).isEmpty()) {
            grievanceRepository.save(Grievance.builder().user(owner).property(home)
                    .subject("Dispute on penalty calculation")
                    .description("Requesting review of late fee surcharge for the previous cycle.")
                    .status("SUBMITTED").build());
        }
    }

    private User user(String email, String name, String phone, Role role) {
        return userRepository.findByEmail(email).orElseGet(() -> userRepository.save(User.builder()
                .email(email).name(name).phoneNumber(phone).role(role).isActive(true)
                .passwordHash(passwordEncoder.encode(seedPassword)).build()));
    }

    private Property property(String id, User owner, String address, String ward, String construction, String status, String area, String assessed) {
        return propertyRepository.findByPropertyId(id).orElseGet(() -> propertyRepository.save(Property.builder()
                .propertyId(id).owner(owner).address(address).wardNo(ward)
                .constructionType(ConstructionType.valueOf(construction)).status(PropertyStatus.valueOf(status))
                .areaSqft(new BigDecimal(area)).assessedValue(new BigDecimal(assessed))
                .lat(new BigDecimal("12.971600")).lng(new BigDecimal("77.594600")).build()));
    }

    private TaxAssessment assessment(Property property, String year, String tax, String penalty, TaxAssessmentStatus status, String due) {
        return assessmentRepository.findByPropertyIdAndFinancialYear(property.getId(), year).orElseGet(() -> {
            BigDecimal base = new BigDecimal(tax), fine = new BigDecimal(penalty);
            return assessmentRepository.save(TaxAssessment.builder().property(property).financialYear(year)
                    .taxAmount(base).penalty(fine).totalDue(base.add(fine)).status(status)
                    .dueDate(LocalDate.parse(due)).build());
        });
    }
}
