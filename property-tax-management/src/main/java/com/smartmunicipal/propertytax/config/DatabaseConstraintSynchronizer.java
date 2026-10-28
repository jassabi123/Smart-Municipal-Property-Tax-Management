package com.smartmunicipal.propertytax.config;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.annotation.Order;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

import javax.sql.DataSource;
import java.sql.Connection;

/**
 * Ensures PostgreSQL table check constraints stay synchronized with Java enum definitions.
 * Hibernate's ddl-auto=update does not alter existing CHECK constraints when enum values are added.
 */
@Slf4j
@Component
@Order(1)
@RequiredArgsConstructor
public class DatabaseConstraintSynchronizer implements CommandLineRunner {

    private final JdbcTemplate jdbcTemplate;
    private final DataSource dataSource;

    @Override
    public void run(String... args) {
        try (Connection conn = dataSource.getConnection()) {
            String dbProductName = conn.getMetaData().getDatabaseProductName();
            if (dbProductName != null && dbProductName.toLowerCase().contains("postgres")) {
                log.info("Verifying PostgreSQL check constraints with enum values...");
                try {
                    jdbcTemplate.execute(
                            "ALTER TABLE properties DROP CONSTRAINT IF EXISTS properties_status_check; " +
                            "ALTER TABLE properties ADD CONSTRAINT properties_status_check " +
                            "CHECK (status IN ('ACTIVE', 'PENDING_VERIFICATION', 'DISPUTED', 'EXEMPTED'))"
                    );
                    jdbcTemplate.execute(
                            "ALTER TABLE tax_assessments DROP CONSTRAINT IF EXISTS tax_assessments_status_check; " +
                            "ALTER TABLE tax_assessments ADD CONSTRAINT tax_assessments_status_check " +
                            "CHECK (status IN ('PENDING', 'PARTIAL', 'PAID', 'OVERDUE', 'DEFAULTED'))"
                    );
                    log.info("PostgreSQL check constraints synchronized successfully.");
                } catch (Exception e) {
                    log.warn("PostgreSQL check constraint synchronization notice: {}", e.getMessage());
                }
            }
        } catch (Exception e) {
            log.debug("Database check skipped: {}", e.getMessage());
        }
    }
}
