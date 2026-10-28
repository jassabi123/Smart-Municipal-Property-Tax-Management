package com.smartmunicipal.propertytax.config;

import com.smartmunicipal.propertytax.entity.AuditLog;
import com.smartmunicipal.propertytax.entity.User;
import com.smartmunicipal.propertytax.repository.AuditLogRepository;
import com.smartmunicipal.propertytax.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Component
@Order(30)
@RequiredArgsConstructor
@Slf4j
public class AuditDataFixSeeder implements CommandLineRunner {

    private final AuditLogRepository auditLogRepository;
    private final UserRepository userRepository;

    @Override
    @Transactional
    public void run(String... args) {
        log.info("Checking and refining municipal audit log fixtures...");

        User admin = userRepository.findByEmail("sample.admin@municipal.local")
                .orElseGet(() -> userRepository.findByEmail("demo.admin@municipal.local").orElse(null));
        User wardOfficer = userRepository.findByEmail("sample.ward@municipal.local")
                .orElseGet(() -> userRepository.findByEmail("demo.ward@municipal.local").orElse(null));
        User commissioner = userRepository.findByEmail("sample.commissioner@municipal.local")
                .orElseGet(() -> userRepository.findByEmail("demo.commissioner@municipal.local").orElse(null));
        User owner = userRepository.findByEmail("sample.owner.one@municipal.local")
                .orElseGet(() -> userRepository.findByEmail("demo.owner@municipal.local").orElse(null));

        // 1. Ensure Property PROP-W02-1392 (1122) has a verification audit log
        boolean hasPropVerify = auditLogRepository.findByEntityTypeAndEntityIdOrderByPerformedAtDesc("Property", 1122L)
                .stream().anyMatch(l -> "VERIFY".equalsIgnoreCase(l.getAction()) || (l.getDescription() != null && l.getDescription().contains("verified")));
        if (!hasPropVerify) {
            auditLogRepository.save(AuditLog.builder()
                    .performedBy(wardOfficer != null ? wardOfficer : admin)
                    .action("VERIFY")
                    .entityType("Property")
                    .entityId(1122L)
                    .description("Property PROP-W02-1392 was verified.")
                    .ipAddress("192.168.1.45")
                    .performedAt(LocalDateTime.now().minusHours(3))
                    .build());
            log.info("Seeded verification audit log for Property PROP-W02-1392");
        }

        // 2. Ensure Grievance #1 has a resolution audit log
        boolean hasGrievanceResolve = auditLogRepository.findByEntityTypeAndEntityIdOrderByPerformedAtDesc("Grievance", 1L)
                .stream().anyMatch(l -> "RESOLVE".equalsIgnoreCase(l.getAction()) || (l.getDescription() != null && l.getDescription().contains("resolved")));
        if (!hasGrievanceResolve) {
            auditLogRepository.save(AuditLog.builder()
                    .performedBy(commissioner != null ? commissioner : admin)
                    .action("RESOLVE")
                    .entityType("Grievance")
                    .entityId(1L)
                    .description("Grievance Ticket #1 was resolved by the Commissioner.")
                    .ipAddress("192.168.1.12")
                    .performedAt(LocalDateTime.now().minusHours(2))
                    .build());
            log.info("Seeded resolution audit log for Grievance Ticket #1");
        }

        // 3. Ensure User registration audit log exists
        boolean hasRegister = auditLogRepository.findByAction("REGISTER").size() > 0;
        if (!hasRegister && owner != null) {
            auditLogRepository.save(AuditLog.builder()
                    .performedBy(owner)
                    .action("REGISTER")
                    .entityType("User")
                    .entityId(owner.getId())
                    .description("New property owner registered: " + owner.getEmail())
                    .ipAddress("192.168.1.88")
                    .performedAt(LocalDateTime.now().minusDays(3))
                    .build());
            log.info("Seeded registration audit log");
        }

        // 4. Ensure Password Reset audit log exists
        boolean hasPasswordReset = auditLogRepository.findByAction("PASSWORD_RESET").size() > 0;
        if (!hasPasswordReset && owner != null) {
            auditLogRepository.save(AuditLog.builder()
                    .performedBy(owner)
                    .action("PASSWORD_RESET")
                    .entityType("User")
                    .entityId(owner.getId())
                    .description("Password reset completed successfully for user: " + owner.getEmail())
                    .ipAddress("192.168.1.88")
                    .performedAt(LocalDateTime.now().minusDays(1))
                    .build());
            log.info("Seeded password reset audit log");
        }

        // 5. Clean up redundant test login spam (keep only 3 recent logins for test admin)
        List<AuditLog> loginLogs = auditLogRepository.findByAction("LOGIN");
        if (loginLogs.size() > 5) {
            // Keep the 3 most recent logins, delete older spam logins
            loginLogs.sort((a, b) -> b.getId().compareTo(a.getId()));
            List<AuditLog> toDelete = loginLogs.subList(3, loginLogs.size());
            auditLogRepository.deleteAll(toDelete);
            log.info("Pruned {} redundant duplicate test login entries from audit ledger", toDelete.size());
        }
    }
}
