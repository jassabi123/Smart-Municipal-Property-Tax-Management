-- Smart Municipal Property Tax Management System
-- Synthetic demonstration data for the existing PostgreSQL schema.
-- No production data, credentials, financial information, or external IDs are used.
-- Execute after the Spring Boot schema has been created (ddl-auto=create/update).
-- The file is safe to re-run for these demo identifiers because inserts use ON CONFLICT DO NOTHING.
-- Exemptions have no status column in the current entity/schema, so no unsupported status is inserted.
-- Demo password for every user: Demo@1234
-- BCrypt hash verified against the application's BCryptPasswordEncoder.

BEGIN;

-- Ensure table check constraints match current application enum definitions
ALTER TABLE properties DROP CONSTRAINT IF EXISTS properties_status_check;
ALTER TABLE properties ADD CONSTRAINT properties_status_check CHECK (status IN ('ACTIVE', 'PENDING_VERIFICATION', 'DISPUTED', 'EXEMPTED'));

ALTER TABLE tax_assessments DROP CONSTRAINT IF EXISTS tax_assessments_status_check;
ALTER TABLE tax_assessments ADD CONSTRAINT tax_assessments_status_check CHECK (status IN ('PENDING', 'PARTIAL', 'PAID', 'OVERDUE', 'DEFAULTED'));

-- 1. USERS
INSERT INTO users (id, name, phone_number, email, password_hash, role, created_date, last_login, is_active) VALUES
(1001, 'Asha Nair',       '9000010001', 'sample.admin@municipal.local',       '$2a$10$nWtEc0F10Evw4Fzw.9VjTu5DGgEOnzUVG8xNIPid8DeJzyHdyXy8S', 'ADMIN',           '2026-01-05 09:00:00', NULL, TRUE),
(1002, 'Bharat Rao',     '9000010002', 'sample.owner.one@municipal.local',   '$2a$10$nWtEc0F10Evw4Fzw.9VjTu5DGgEOnzUVG8xNIPid8DeJzyHdyXy8S', 'PROPERTY_OWNER',  '2026-01-05 09:05:00', NULL, TRUE),
(1003, 'Chitra Menon',   '9000010003', 'sample.owner.two@municipal.local',   '$2a$10$nWtEc0F10Evw4Fzw.9VjTu5DGgEOnzUVG8xNIPid8DeJzyHdyXy8S', 'PROPERTY_OWNER',  '2026-01-05 09:10:00', NULL, TRUE),
(1004, 'Dev Shah',       '9000010004', 'sample.assessor@municipal.local',     '$2a$10$nWtEc0F10Evw4Fzw.9VjTu5DGgEOnzUVG8xNIPid8DeJzyHdyXy8S', 'TAX_ASSESSOR',    '2026-01-05 09:15:00', NULL, TRUE),
(1005, 'Esha Kulkarni',  '9000010005', 'sample.ward@municipal.local',        '$2a$10$nWtEc0F10Evw4Fzw.9VjTu5DGgEOnzUVG8xNIPid8DeJzyHdyXy8S', 'WARD_OFFICER',    '2026-01-05 09:20:00', NULL, TRUE),
(1006, 'Farhan Ali',     '9000010006', 'sample.finance@municipal.local',      '$2a$10$nWtEc0F10Evw4Fzw.9VjTu5DGgEOnzUVG8xNIPid8DeJzyHdyXy8S', 'FINANCE_OFFICER', '2026-01-05 09:25:00', NULL, TRUE),
(1007, 'Gauri Iyer',     '9000010007', 'sample.commissioner@municipal.local', '$2a$10$nWtEc0F10Evw4Fzw.9VjTu5DGgEOnzUVG8xNIPid8DeJzyHdyXy8S', 'COMMISSIONER',    '2026-01-05 09:30:00', NULL, TRUE),
(1008, 'Hari Das',       '9000010008', 'sample.guest@municipal.local',       '$2a$10$nWtEc0F10Evw4Fzw.9VjTu5DGgEOnzUVG8xNIPid8DeJzyHdyXy8S', 'GUEST',           '2026-01-05 09:35:00', NULL, TRUE)
ON CONFLICT DO NOTHING;

-- 2. PROPERTIES: ten synthetic properties linked to the two owner accounts.
INSERT INTO properties (id, property_id, owner_id, address, ward_no, area_sqft, construction_type, assessed_value, lat, lng, status) VALUES
(1101, 'SAMPLE-RES-001', 1002, '11 Lakeview Road',       'W-01', 1200.00, 'RESIDENTIAL',  580000.00, 12.971600, 77.594600, 'ACTIVE'),
(1102, 'SAMPLE-RES-002', 1002, '42 Palm Street',         'W-01', 1450.00, 'RESIDENTIAL',  720000.00, 12.972100, 77.595100, 'ACTIVE'),
(1103, 'SAMPLE-SHOP-003',1002, '8 Central Market',       'W-02', 2100.00, 'COMMERCIAL',  1380000.00, 12.973000, 77.596000, 'ACTIVE'),
(1104, 'SAMPLE-VILLA-004',1002, '7 Heritage Enclave',    'W-03', 2800.00, 'RESIDENTIAL',  1950000.00, 12.974000, 77.597000, 'EXEMPTED'),
(1105, 'SAMPLE-IND-005',  1002, '19 Industrial Layout',  'W-04', 9500.00, 'INDUSTRIAL',   6200000.00, 12.975000, 77.598000, 'DISPUTED'),
(1106, 'SAMPLE-RES-006', 1003, '3 Sunrise Avenue',      'W-05', 980.00,  'RESIDENTIAL',  460000.00, 12.976000, 77.599000, 'ACTIVE'),
(1107, 'SAMPLE-SHOP-007',1003, '55 Station Bazaar',      'W-05', 1750.00, 'COMMERCIAL',  1120000.00, 12.977000, 77.600000, 'ACTIVE'),
(1108, 'SAMPLE-VAC-008', 1003, '22 East Bypass',         'W-06', 3200.00, 'VACANT',       850000.00, 12.978000, 77.601000, 'ACTIVE'),
(1109, 'SAMPLE-RES-009', 1003, '90 Riverbank Colony',    'W-07', 1320.00, 'RESIDENTIAL',  675000.00, 12.979000, 77.602000, 'ACTIVE'),
(1110, 'SAMPLE-COM-010', 1003, '6 Civic Plaza',          'W-08', 3900.00, 'COMMERCIAL',  2650000.00, 12.980000, 77.603000, 'ACTIVE')
ON CONFLICT DO NOTHING;

-- 3. TAX ASSESSMENTS: sixteen records linked to valid properties.
INSERT INTO tax_assessments (id, property_id, financial_year, tax_amount, penalty, total_due, status, due_date) VALUES
(1201, 1101, '2024-25', 14500.00,    0.00, 14500.00, 'PAID',      '2025-03-31'),
(1202, 1101, '2025-26', 15200.00,    0.00, 15200.00, 'PAID',      '2026-03-31'),
(1203, 1102, '2025-26', 18800.00,    0.00, 18800.00, 'PARTIAL',   '2026-03-31'),
(1204, 1103, '2025-26', 56500.00, 2500.00, 59000.00, 'DEFAULTED', '2026-03-31'),
(1205, 1104, '2025-26', 42000.00,    0.00, 42000.00, 'PENDING',   '2026-03-31'),
(1206, 1105, '2025-26', 210000.00,   0.00, 210000.00,'PENDING',   '2026-03-31'),
(1207, 1106, '2024-25', 11800.00,    0.00, 11800.00, 'PAID',      '2025-03-31'),
(1208, 1106, '2025-26', 12400.00,    0.00, 12400.00, 'PAID',      '2026-03-31'),
(1209, 1107, '2025-26', 46500.00, 1500.00, 48000.00, 'PARTIAL',   '2026-03-31'),
(1210, 1108, '2025-26', 22000.00,    0.00, 22000.00, 'PENDING',   '2026-03-31'),
(1211, 1109, '2025-26', 16000.00,    0.00, 16000.00, 'PENDING',   '2026-03-31'),
(1212, 1110, '2025-26', 98000.00, 4000.00,102000.00, 'DEFAULTED', '2026-03-31'),
(1213, 1102, '2024-25', 17900.00,    0.00, 17900.00, 'PAID',      '2025-03-31'),
(1214, 1103, '2024-25', 54000.00,    0.00, 54000.00, 'PAID',      '2025-03-31'),
(1215, 1107, '2024-25', 44000.00,    0.00, 44000.00, 'PAID',      '2025-03-31'),
(1216, 1110, '2024-25', 93000.00,    0.00, 93000.00, 'PAID',      '2025-03-31')
ON CONFLICT DO NOTHING;

-- 4. PAYMENTS: ten synthetic payments linked to valid assessments.
INSERT INTO tax_payments (id, assessment_id, amount_paid, payment_mode, transaction_id, paid_date, receipt_no) VALUES
(1301, 1201, 14500.00, 'UPI',         'SAMPLE-TXN-001', '2025-03-12 10:10:00', 'SAMPLE-RCP-001'),
(1302, 1202, 15200.00, 'NET_BANKING', 'SAMPLE-TXN-002', '2026-03-05 11:20:00', 'SAMPLE-RCP-002'),
(1303, 1203, 10000.00, 'CARD',        'SAMPLE-TXN-003', '2026-03-08 12:30:00', 'SAMPLE-RCP-003'),
(1304, 1207, 11800.00, 'CASH',        'SAMPLE-TXN-004', '2025-03-15 09:00:00', 'SAMPLE-RCP-004'),
(1305, 1208, 12400.00, 'UPI',         'SAMPLE-TXN-005', '2026-03-09 13:40:00', 'SAMPLE-RCP-005'),
(1306, 1209, 25000.00, 'CARD',        'SAMPLE-TXN-006', '2026-03-10 14:50:00', 'SAMPLE-RCP-006'),
(1307, 1213, 17900.00, 'DD',          'SAMPLE-TXN-007', '2025-03-20 15:00:00', 'SAMPLE-RCP-007'),
(1308, 1214, 54000.00, 'NET_BANKING', 'SAMPLE-TXN-008', '2025-03-22 15:30:00', 'SAMPLE-RCP-008'),
(1309, 1215, 44000.00, 'UPI',         'SAMPLE-TXN-009', '2025-03-25 16:00:00', 'SAMPLE-RCP-009'),
(1310, 1216, 93000.00, 'CARD',        'SAMPLE-TXN-010', '2025-03-28 16:30:00', 'SAMPLE-RCP-010')
ON CONFLICT DO NOTHING;

-- 5. NOC REQUESTS: status is a String in the current entity, so these are supported values.
INSERT INTO noc_requests (id, property_id, requested_by, issued_by, status, request_date, issue_date, remarks) VALUES
(1401, 1101, 1002, 1005, 'APPROVED', '2026-01-12 09:00:00', '2026-01-15 14:00:00', 'Synthetic residential NOC approved.'),
(1402, 1102, 1002, NULL, 'PENDING', '2026-01-18 10:30:00', NULL, 'Synthetic request awaiting ward review.'),
(1403, 1103, 1002, 1005, 'REJECTED', '2026-01-20 11:00:00', '2026-01-22 12:00:00', 'Synthetic record: outstanding dues require review.'),
(1404, 1106, 1003, 1005, 'APPROVED', '2026-01-14 09:30:00', '2026-01-17 15:00:00', 'Synthetic residential NOC approved.'),
(1405, 1107, 1003, NULL, 'PENDING', '2026-01-21 13:00:00', NULL, 'Synthetic commercial request in review.'),
(1406, 1110, 1003, 1005, 'REJECTED', '2026-01-23 14:00:00', '2026-01-25 10:00:00', 'Synthetic documentation incomplete.')
ON CONFLICT DO NOTHING;

-- 6. EXEMPTIONS: current schema has no status column; approved_by is the only approval relation.
INSERT INTO exemptions (id, property_id, exemption_type, percentage, valid_from, valid_to, approved_by) VALUES
(1501, 1104, 'SENIOR_CITIZEN', 25.00, '2025-04-01', '2026-03-31', 1006),
(1502, 1101, 'WIDOW',          15.00, '2025-04-01', '2026-03-31', 1006),
(1503, 1106, 'SENIOR_CITIZEN', 20.00, '2025-04-01', '2026-03-31', 1006),
(1504, 1109, 'DISABILITY',     30.00, '2025-04-01', '2026-03-31', 1006),
(1505, 1102, 'GOVERNMENT',     10.00, '2025-04-01', '2026-03-31', 1006),
(1506, 1108, 'OTHER',            5.00, '2025-04-01', '2026-03-31', 1006)
ON CONFLICT DO NOTHING;

-- 7. NOTICES: notice_type and status are String columns in the current schema.
INSERT INTO notices (id, property_id, issued_by, notice_type, message, issued_date, status) VALUES
(1601, 1103, 1005, 'ARREAR_RECOVERY', 'Synthetic notice: commercial tax arrears require settlement.', '2026-01-28 09:00:00', 'ISSUED'),
(1602, 1105, 1005, 'PROPERTY_REVIEW',  'Synthetic notice: disputed industrial property requires review.', '2026-01-29 10:00:00', 'ISSUED'),
(1603, 1107, 1005, 'PAYMENT_REMINDER', 'Synthetic notice: partial assessment payment is outstanding.', '2026-01-30 11:00:00', 'ISSUED'),
(1604, 1110, 1005, 'ARREAR_RECOVERY', 'Synthetic notice: commercial arrears are past the due date.', '2026-02-01 12:00:00', 'ISSUED'),
(1605, 1102, 1005, 'GENERAL',         'Synthetic notice: annual property record review completed.', '2026-02-02 13:00:00', 'ISSUED'),
(1606, 1104, 1005, 'EXEMPTION_REVIEW', 'Synthetic notice: exemption record is due for annual review.', '2026-02-03 14:00:00', 'ISSUED'),
(1607, 1106, 1005, 'PAYMENT_REMINDER', 'Synthetic notice: retain the payment receipt for reference.', '2026-02-04 15:00:00', 'ISSUED'),
(1608, 1109, 1005, 'GENERAL',         'Synthetic notice: ward assessment information updated.', '2026-02-05 16:00:00', 'ISSUED')
ON CONFLICT DO NOTHING;

-- 8. NOTIFICATIONS
INSERT INTO notifications (id, recipient_id, channel, event_type, message, delivery_status, is_read, created_at) VALUES
(1701, 1002, 'IN_APP', 'ASSESSMENT_ISSUED', 'Synthetic notification: your 2025-26 assessment is available.', 'DELIVERED', FALSE, '2026-02-06 09:00:00'),
(1702, 1002, 'IN_APP', 'PAYMENT_RECEIVED',   'Synthetic notification: payment receipt SAMPLE-RCP-002 is available.', 'DELIVERED', TRUE,  '2026-02-06 09:05:00'),
(1703, 1002, 'IN_APP', 'NOC_STATUS',         'Synthetic notification: your NOC request is pending review.', 'DELIVERED', FALSE, '2026-02-06 09:10:00'),
(1704, 1003, 'IN_APP', 'ASSESSMENT_ISSUED', 'Synthetic notification: your 2025-26 assessment is available.', 'DELIVERED', FALSE, '2026-02-06 09:15:00'),
(1705, 1003, 'IN_APP', 'NOTICE_ISSUED',     'Synthetic notification: a municipal notice is available.', 'DELIVERED', FALSE, '2026-02-06 09:20:00'),
(1706, 1004, 'IN_APP', 'ASSESSMENT_REVIEW', 'Synthetic notification: assessment review queue updated.', 'DELIVERED', TRUE,  '2026-02-06 09:25:00'),
(1707, 1005, 'IN_APP', 'NOC_REQUEST',      'Synthetic notification: new NOC requests are awaiting review.', 'DELIVERED', FALSE, '2026-02-06 09:30:00'),
(1708, 1006, 'IN_APP', 'EXEMPTION_REVIEW', 'Synthetic notification: exemption applications are ready for review.', 'DELIVERED', FALSE, '2026-02-06 09:35:00')
ON CONFLICT DO NOTHING;

-- 9. AUDIT LOGS
INSERT INTO audit_logs (id, performed_by, action, entity_type, entity_id, description, ip_address, performed_at) VALUES
(1801, 1001, 'CREATE', 'Property',      1101, 'Synthetic demo property created.', '192.0.2.11', '2026-02-06 10:00:00'),
(1802, 1004, 'CREATE', 'TaxAssessment', 1201, 'Synthetic demo assessment created.', '192.0.2.12', '2026-02-06 10:05:00'),
(1803, 1006, 'CREATE', 'Exemption',     1501, 'Synthetic demo exemption approved.', '192.0.2.13', '2026-02-06 10:10:00'),
(1804, 1005, 'CREATE', 'Notice',         1601, 'Synthetic demo notice issued.', '192.0.2.14', '2026-02-06 10:15:00'),
(1805, 1002, 'CREATE', 'NOCRequest',     1402, 'Synthetic demo NOC requested.', '192.0.2.15', '2026-02-06 10:20:00'),
(1806, 1002, 'LOGIN',  'User',           1002, 'Synthetic demo login event.', '192.0.2.16', '2026-02-06 10:25:00'),
(1807, 1001, 'UPDATE', 'User',           1008, 'Synthetic demo user activated.', '192.0.2.17', '2026-02-06 10:30:00'),
(1808, 1007, 'UPDATE', 'Property',       1105, 'Synthetic demo property status reviewed.', '192.0.2.18', '2026-02-06 10:35:00')
ON CONFLICT DO NOTHING;

-- PostgreSQL identity sequences used by the existing schema. These values ensure
-- subsequent application-generated inserts do not collide with explicit demo IDs.
SELECT setval('users_id_seq',          (SELECT MAX(id) FROM users), TRUE);
SELECT setval('properties_id_seq',     (SELECT MAX(id) FROM properties), TRUE);
SELECT setval('tax_assessments_id_seq',(SELECT MAX(id) FROM tax_assessments), TRUE);
SELECT setval('tax_payments_id_seq',   (SELECT MAX(id) FROM tax_payments), TRUE);
SELECT setval('noc_requests_id_seq',   (SELECT MAX(id) FROM noc_requests), TRUE);
SELECT setval('exemptions_id_seq',     (SELECT MAX(id) FROM exemptions), TRUE);
SELECT setval('notices_id_seq',        (SELECT MAX(id) FROM notices), TRUE);
SELECT setval('notifications_id_seq',  (SELECT MAX(id) FROM notifications), TRUE);
SELECT setval('audit_logs_id_seq',     (SELECT MAX(id) FROM audit_logs), TRUE);

COMMIT;

-- Verify counts after execution:
-- SELECT 'users' table_name, count(*) FROM users WHERE id >= 1001
-- UNION ALL SELECT 'properties', count(*) FROM properties WHERE id >= 1101
-- UNION ALL SELECT 'tax_assessments', count(*) FROM tax_assessments WHERE id >= 1201
-- UNION ALL SELECT 'tax_payments', count(*) FROM tax_payments WHERE id >= 1301
-- UNION ALL SELECT 'noc_requests', count(*) FROM noc_requests WHERE id >= 1401
-- UNION ALL SELECT 'exemptions', count(*) FROM exemptions WHERE id >= 1501
-- UNION ALL SELECT 'notices', count(*) FROM notices WHERE id >= 1601
-- UNION ALL SELECT 'notifications', count(*) FROM notifications WHERE id >= 1701
-- UNION ALL SELECT 'audit_logs', count(*) FROM audit_logs WHERE id >= 1801;
