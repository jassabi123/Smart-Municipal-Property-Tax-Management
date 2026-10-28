## Software Requirements Specification (SRS)

## Smart Municipal Property Tax Management System

## 1. Introduction

## 1.1 Purpose

Defines requirements for a Municipal Property Tax Management System enabling urban local bodies to manage property records, tax calculation, online payment, and compliance.

## 1.2 Scope

Enables municipal corporations to manage property registrations, automated tax assessment, online payment, exemption management, and arrear recovery. Key functionalities:

- Property owner and municipal officer authentication

- Property registration with GIS mapping

- Automated tax calculation with configurable formula

- Online tax payment with UPI, card, net banking

- Exemption management for senior citizens and charities

- Arrear tracking and recovery notice generation

- NOC issuance for property transactions

- Grievance management for tax disputes

- Analytics for collection efficiency and defaulters

- Integration with land records and registration systems

## 1.3 Definitions, Acronyms, and Abbreviations

- ULB: Urban Local Body

- GIS: Geographic Information System

- NOC: No Objection Certificate

- SRO: Sub-Registrar Office

## 1.4 References

- IEEE Std 830-1998: IEEE Recommended Practice for Software Requirements Specifications

- Spring Boot Security Documentation

- React.js Documentation

- Municipal Finance Commission Guidelines

- Property Tax Assessment Regulations

## 1.5 Overview

Covers all requirements for the Smart Municipal Property Tax Management System with role-based security and comprehensive property tax management management.

## 2. Overall Description

## 2.1 Product Perspective

Spring Boot + React.js + JWT + JPA for property tax management operations.

## 2.2 Product Functions

- User registration and authentication with property tax management role-based access


- Complete CRUD operations for all property tax management records

- Property lifecycle management from creation through completion

- Real-time status tracking and milestone notifications

- Property Tax Management analytics and performance reporting

- Document management with version control

- Integration with relevant external systems

- Mobile-responsive access for all user types

- Notification system for all key events

- Compliance reporting and audit trail management

## 2.3 User Classes and Characteristics

- System Administrator: Full property tax management system access and configuration

- Property Tax Manager: Comprehensive operational management

- Property Tax Supervisor: Day-to-day workflow management

- Property Tax Officer: Operational task execution

- Property: Own record access and self-service functions

- Guest: Read-only access to public information

## 2.4 Operating Environment

- Server: Spring Boot 3.x with Spring Security (Java 17+)

- Database: JPA-compatible relational database with property tax management management schema

- Frontend: React.js with authentication components (port 8081)

- Backend: Spring Boot with Spring Security REST APIs (port 8080)

- Authentication: JWT-based with role-specific token claims and expiry

- Testing: JUnit 5 for backend, React Testing Library for frontend

- Deployment: Docker containerised on cloud (AWS, Azure, or GCP)

## 2.5 Design and Implementation Constraints

- Spring Security and JWT on all property tax management endpoints

- Name: alphabetic only; Phone: exactly 10 digits

- All property records require validation before saving

- Role-based access enforced at both React route and API level

- All data modifications logged with user identity and timestamp

## 2.6 User Documentation

- Property Tax Management manager user guide

- Property self-service portal guide

- Administrator configuration guide

- Compliance and reporting guide

## 2.7 Assumptions and Dependencies

- Users have internet access for property tax management system access

- Integration with relevant property tax management external systems available

- Email and SMS services available for notifications

- Cloud infrastructure available for deployment

## 3. Specific Requirements

## 3.1 External Interfaces

## 3.1.1 User Interfaces

- Landing Page: Smart Municipal Property Tax Management System overview with login


- Property Dashboard: Core property tax management management interface

- Analytics: Property Tax Management performance charts

- Admin Panel: User management and configuration

## 3.1.2 Hardware Interfaces

- Document scanner

- Digital signature pad

- Barcode/QR scanner

## 3.1.3 Software Interfaces

- JWT REST API

- Email service

- SMS gateway

- Document storage

## 3.1.4 Communication Interfaces

- HTTPS with TLS 1.3 for all client-server communications

- JSON with security headers (CORS, CSP, X-Frame-Options) on all responses

- JWT HMAC-SHA256 signature verification on every API request

- WebSocket for real-time notifications and live dashboard updates

## 3.2 Functional Requirements

## User Authentication and Account Management

## FR1: User Registration and Authentication

Description: Provide property tax management-specific registration.

## Detailed Requirements:

- Registration captures name, user ID, email, role, property tax management assignment, and contact

- Email OTP verification and ID validation required before activation

- Multi-role support handles Guest, Property Owner, Ward Officer, Tax Assessor accounts

- Supervisor approval required for all operational roles before platform access

- Password enforces minimum 8 characters with uppercase, lowercase, digit, and special character

- Account recovery uses time-limited email OTP with 15-minute validity window

- Profile management allows post-registration updates with complete audit trail

- Security logging records every event with IP address and timestamp

- Two-factor authentication mandatory for admin and financial operations

- All property tax management operational data requires authentication — no anonymous access

## FR2: Session Management

Description: Secure sessions for property tax management operations.

## Detailed Requirements:

- JWT tokens with role-specific expiry durations

- Multi-credential login: user ID, email, or mobile

- Auto-logout after 30 minutes of inactivity

- Device recognition with extra verification for new devices

- Progressive lockout: 15, 30, 1440 minutes after 5, 10, 15 failures

- SSO with corporate systems

- All events logged for compliance audit

- Token blacklisting on logout and breach events


- Emergency override for critical operational scenarios

- Full session audit trail maintained

## FR3: Role-Based Access Control

Description: Granular RBAC for property tax management data.

## Detailed Requirements:

- Users access only own records; managers access assigned team scope; admin accesses everything

- Hierarchical configurable permissions per role and function

- Temporal controls enforce operational hours

- Sensitive operations restricted by function permissions

- Users see only data relevant to their role and assignment scope

- Every access logged with user identity, timestamp, and declared purpose

- Role changes take effect on the user's next login

- Cross-department access requires approval

- Guest access limited to public information only

- Permission matrix maintained in database for runtime enforcement without code deployment

## Core System Operations

## FR4: Property Registration and Management

Description: Register and manage property records.

## Detailed Requirements:

- Registration form captures all required property tax management fields with complete format validation

- Document upload and verification workflow with expiry date tracking

- Unique ID generation following configured structured format

- Status lifecycle with all transitions logged

- Bulk CSV import with field-level validation and detailed error reporting

- Version history maintained for all record modifications

- Search and filter across all record types by multiple criteria

- Duplicate detection on unique identifiers before record creation

- External verification system integration where applicable

- Registration volume and status distribution analytics dashboard

## FR5: Workflow Processing

Description: Process property tax management workflows end-to-end.

## Detailed Requirements:

- Workflow captures all required property tax management operational fields with validation

- Multi-step approval process with configurable workflow stages

- Status update notifications dispatched at each workflow stage transition

- SLA tracking per workflow type with breach alerts and automatic escalation

- Document attachment supported at each workflow stage for evidence

- Complete history log with full chronological audit trail

- Bulk workflow operations for operational efficiency

- Integration with related external systems and data sources

- Workflow analytics: average cycle time and completion rate by type

- Exception handling with documented override procedures and approval


## FR6: Scheduling and Resource Management

Description: Manage property tax management scheduling and resource allocation.

## Detailed Requirements:

- Schedule creation with resource assignment and time slot configuration

- Availability check performed before schedule confirmation

- Notification dispatched to all participants on schedule confirmation

- Calendar view with filter and search across all schedule types

- Rescheduling workflow with mandatory reason capture and notification

- Cancellation workflow with all stakeholder notification

- Conflict detection prevents double-assignment of resources

- Reminder notifications at configured intervals before scheduled events

- Utilisation analytics for capacity planning and optimisation

- Recurring schedule configuration for regular operational events

## FR7: Document and Compliance Management

Description: Manage property tax management documents and regulatory compliance.

## Detailed Requirements:

- Document upload with metadata, category, and expiry date capture

- Version control with full rollback capability to any previous version

- Access control configured per document type and sensitivity level

- Expiry alerts dispatched at configured days before document due date

- Digital signature capture for approvals and authorisations

- Complete audit trail for all document access and modification events

- Bulk document operations for migration and management efficiency

- Full-text search across the document repository by keyword and metadata

- Retention policy with automated archival triggered on retention date

- Export in PDF and other standard formats for submission and reporting

## FR8: Communication and Notification System

Description: Manage property tax management stakeholder communications.

## Detailed Requirements:

- Multi-channel notifications: in-app push, email, and SMS per user preference

- Event-triggered automated notifications on all key system events

- Configurable notification templates with variable substitution

- Delivery status tracking with automatic retry for failed deliveries

- Broadcast capability to defined stakeholder groups by role or segment

- Reminder sequence for pending actions at configured intervals

- Digest emails for activity summaries to managers and administrators

- Escalation alerts for SLA breaches dispatched to supervisors

- User notification preference management per channel and type

- Communication audit trail maintained for all notifications

## FR9: Analytics and Reporting Dashboard

Description: Comprehensive analytics and reporting for property tax management.

## Detailed Requirements:

- Real-time property tax management operational KPI dashboard with drill-down capability


- Trend charts showing daily, weekly, and monthly performance over time

- Custom parametric reports with date range and dimension filters

- Comparison reports against configured targets and historical benchmarks

- Export in PDF, Excel, and CSV formats for distribution and filing

- Automated scheduled reports distributed to configured stakeholder list

- Drill-down capability from summary view to individual transaction level

- Predictive analytics from historical patterns for forward planning

- Role-specific dashboards showing metrics most relevant to each role

- Mobile-accessible dashboard for management review on any device

## FR10: Integration and External Connectivity

Description: External system integration for property tax management.

## Detailed Requirements:

- REST API integration with all primary external operational systems

- Webhook support for real-time event broadcasting to connected systems

- File-based integration via validated CSV or XML for batch operations

- OAuth 2.0 or API key authentication for all external connections

- Error handling with retry logic and dead-letter queue for failures

- Integration monitoring dashboard displaying connection status and errors

- Data transformation layer for field and format mapping between systems

- Bulk synchronisation support for initial data migration workloads

- Staging integration environment for development and testing

- SLA monitoring for all integration health metrics

## FR11: Mobile and Remote Access

Description: Mobile access for property tax management field operations.

## Detailed Requirements:

- Mobile-responsive web application optimised for smartphone use

- Native app with offline capability for poor-connectivity environments

- Push notifications for all real-time operational alerts

- Camera integration for photo capture and document scanning

- GPS location services for geo-tagged operational records

- Biometric or PIN security enforced on all mobile devices

- Background synchronisation on connectivity restoration

- Touch-optimised UI with large interactive elements for ease of use

- Offline mode indicator clearly displaying cached content and last sync time

- Mobile analytics tracking feature adoption and session patterns

## FR12: Security and Compliance

Description: Security and compliance management for property tax management.

## Detailed Requirements:

- AES-256 at rest for all sensitive data

- TLS 1.3 for all communications

- Role-based access prevents any cross-user data leakage at API level

- Immutable audit logging for all data access and modification events

- Monthly automated vulnerability scans plus quarterly internal review

- Data retention and archival policies automatically enforced

- Encrypted backups stored in geographically separate data centres


- Annual professional penetration testing

- GDPR-aligned data deletion procedures

- On-demand compliance audit packages for regulatory inspection readiness

## FR13: Advanced Analytics and Predictive Intelligence

Description: Predictive analytics for property tax management.

## Detailed Requirements:

- Predictive demand forecasting using property tax management historical operational data

- Risk scoring for prioritised management attention and intervention

- Anomaly detection with automated alerts for unusual patterns

- Comparative benchmarking against peer organisations and industry standards

- Optimisation recommendations generated from operational performance data

- Cohort analysis for trend identification and pattern recognition

- Machine learning model for outcome prediction and planning support

- Visual analytics including heat maps, trend lines, and funnel diagrams

- Natural language weekly insight summary for management consumption

- Evidence-based strategic planning tools from consolidated analytics

## System Administration and Security

## FR14: Exception Handling

Description: Comprehensive exception handling for property tax management.

## Detailed Requirements:

- Name validation: 'Name must not contain special characters or numbers'

- Phone validation: 'Phone Number must be exactly 10 digits long'

- DuplicatePropertyException prevents duplicate unique identifier creation

- Custom exceptions in com.examly.springapp.exception: InvalidNameException, InvalidPhoneException, DuplicatePropertyException

- Structured logs capture exception type, user context, affected record, and timestamp

- User-facing messages are clear and actionable without exposing system internals

- Exponential back-off retry for all transient external service failures

- Graceful degradation on database and external API failures

- Exception analytics track frequency by type and mean resolution time

- Integration errors logged and escalated to operations team immediately

## FR15: Data Security

Description: Comprehensive data protection for property tax management.

## Detailed Requirements:

- AES-256 encryption at rest for all sensitive data fields

- TLS 1.3 plus HSTS in transit

- RBAC enforced at every API service layer endpoint

- Server-side sanitisation against SQL injection and XSS

- Immutable audit logging of all data access and modification events

- Real-time intrusion detection with automated blocking

- Automated archival and deletion policies enforced

- Encrypted backups stored in geographically separate data centres

- Monthly automated scans and annual professional penetration testing


- Compliance audit packages generated on regulatory request

## FR16: System Administration

Description: Comprehensive administrative tools for lifecycle and compliance.

## Detailed Requirements:

- User lifecycle: creation, role changes, suspension, deactivation with full audit

- System configuration updates through admin portal without code redeployment

- Real-time admin dashboard with users, activity, and system health metrics

- Bulk CSV import with field validation and detailed error reporting

- System health monitoring: API response, error rates, and storage utilisation

- Daily encrypted backups with weekly restoration testing

- Searchable tamper-evident audit trail

- Integration monitoring dashboard for all external API connections

- Notification template management for all system communications

- Compliance calendar tracking all regulatory deadlines and licence renewals

## FR17: Advanced Analytics

Description: Analytics and predictive intelligence for property tax management.

## Detailed Requirements:

- Real-time property tax management operational KPI dashboard with trend charts

- Custom parametric report builder with date range and dimension filters

- Data export in PDF, Excel, and CSV for management and regulatory reporting

- ML-powered anomaly detection identifying unusual patterns requiring attention

- Predictive modelling for demand and resource requirement forecasting

- Comparative benchmarking against industry or peer-group performance standards

- User behaviour analytics identifying workflow bottlenecks and optimisation opportunities

- Automated weekly insight reports for configured management stakeholders

- Risk scoring model ranks records by composite risk factors for prioritised intervention

- Evidence-based strategic planning recommendations generated from analytics data

## 3.3 Performance Requirements

- Authentication: Login < 1 second for 95% of requests

- Record management: Create, read, update, delete < 2 seconds for 90% of requests

- Search: Results returned < 1.5 seconds for complex multi-field queries

- Validation: Combined client and server validation < 1 second for 95% of submissions

- Concurrent users: 500+ simultaneous users without performance degradation

- Reports: Standard reports generate in < 10 seconds for typical data volumes

- Notifications: End-to-end delivery within 5 seconds of trigger event

## 3.4 Logical Database Requirements

## Core Tables:

- Users Table: id, name, phone_number, email, password_hash, role, created_date, last_login, is_active

- Properties Table: id, property_id, owner_id, address, ward_no, area_sqft, construction_type, assessed_value, lat, lng, status

- TaxAssessments Table: id, property_id, financial_year, tax_amount, penalty, total_due, status, due_date

- TaxPayments Table: id, assessment_id, amount_paid, payment_mode, transaction_id, paid_date, receipt_no


- Exemptions Table: id, property_id, exemption_type, percentage, valid_from, valid_to, approved_by

## 3.5 Design Constraints

- Spring Security+JWT on all endpoints

- React protected routes + mobile-responsive

- JPA transactions for data integrity

- All changes logged with user and timestamp

- Name: alphabetic only; Phone: exactly 10 digits

- RBAC at React route and Spring Boot API level

## 3.6 Software System Attributes

## 3.6.1 Reliability

- 99.9% uptime with planned maintenance communicated 48 hours ahead

- Graceful non-sensitive error messages for all system failures

- Multi-layer data integrity validation at client, API, service, and database levels

- Automatic failover for critical property tax management operations within 60 seconds

- Daily encrypted backups with quarterly restoration testing

## 3.6.2 Availability

- 24/7 availability with maintenance outside peak operational hours

- Load balancing across minimum two application server instances

- Geographic data replication to secondary data centre for disaster recovery

- Real-time health monitoring with automated on-call escalation

- Horizontal auto-scaling for peak load periods

## 3.6.3 Security

- Authentication: JWT HS256 with role-specific session duration configuration

- Authorisation: Role-based access control at API service layer for every endpoint

- Data Protection: AES-256 at rest and TLS 1.3 in transit for all sensitive data

- Input Validation: Server-side sanitisation against injection and XSS attacks

- Audit Trail: Immutable logging of all data access and modification events

- Compliance: Regulatory standards verified and documented at every major release

## 3.6.4 Maintainability

- Layered architecture: Controller, Service, Repository, Domain Model layers

- Minimum 85% unit and integration test coverage measured in CI pipeline

- Swagger/OpenAPI 3.0 documentation with examples for every endpoint

- Git feature branch workflow with mandatory peer code review

- Spring Boot profiles with encrypted secret management

## 3.6.5 Portability

- Docker + Docker Compose for consistent local and production deployments

- Spring Data JPA: MySQL 8.0+ and PostgreSQL 14+ without code changes

- Cloud manifests: AWS ECS, Azure AKS, GCP GKE

- Spring Boot profiles: dev, test, staging, production

- Cross-browser: Chrome 100+, Firefox 100+, Edge 100+, Safari 15+

## 3.7 Other Requirements

- Testing: Backend 85% JUnit 5 and Mockito; Frontend 75% React Testing Library

- Security Testing: Quarterly OWASP ZAP + annual professional penetration testing

- Performance Testing: Monthly JMeter load tests before each major release

- Documentation: API reference, deployment runbook, user manuals each release


- Compliance: Government regulatory standards verified at every major release

- Accessibility: WCAG 2.1 Level AA for all user-facing interfaces

## 4. Appendices

## Appendix A: Role-Based Permission Matrix

| Functionality | Guest | Property Ward Owner |   | Officer | Tax Assessor Officer |   | Finance Commissi Admin | oner |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| View Tax Info View Own Tax Pay Tax Assess Property Issue NOC Approve Exemption View Analytics Issue Notices Manage Properties Manage Users | - - - - - - - - - | L - |   |   |   |   |   |   |
|   |   |   | - - - - - - - |   | - | - - - |   | - |
|   |   | - - |   |   | - L |   |   |   |
|   |   | - - |   |   | - | - |   | - |

## Appendix B: Database Schema Details

## Users Table:

- id (PRIMARY KEY)

- name (VARCHAR, NOT NULL) — alphabetic only

- phone_number (VARCHAR 10, NOT NULL) — exactly 10 digits

- email (VARCHAR, UNIQUE, NOT NULL)

- password_hash (VARCHAR, NOT NULL)

- role (ENUM)

- created_date (TIMESTAMP)

- last_login (TIMESTAMP)

- is_active (BOOLEAN DEFAULT TRUE)

## Properties Table:

- id (PRIMARY KEY)

- property_id (VARCHAR UNIQUE)

- owner_id (FK)

- address (TEXT)

- ward_no (VARCHAR)

- area_sqft (DECIMAL)

- construction_type (ENUM: RESIDENTIAL,COMMERCIAL,INDUSTRIAL,VACANT)

- assessed_value (DECIMAL)

- lat (DECIMAL)

- lng (DECIMAL)


- status (ENUM: ACTIVE,DISPUTED,EXEMPTED)

## TaxAssessments Table:

- id (PRIMARY KEY)

- property_id (FK)

- financial_year (VARCHAR)

- tax_amount (DECIMAL)

- penalty (DECIMAL DEFAULT 0)

- total_due (DECIMAL)

- status (ENUM: PENDING,PARTIAL,PAID,DEFAULTED)

- due_date (DATE)

## TaxPayments Table:

- id (PRIMARY KEY)

- assessment_id (FK)

- amount_paid (DECIMAL)

- payment_mode (ENUM: UPI,CARD,NET_BANKING,CASH,DD)

- transaction_id (UNIQUE)

- paid_date (TIMESTAMP)

- receipt_no (VARCHAR UNIQUE)

## Exemptions Table:

- id (PRIMARY KEY)

- property_id (FK)

- exemption_type (VARCHAR)

- percentage (DECIMAL)

- valid_from (DATE)

- valid_to (DATE)

- approved_by (FK)

## Appendix C: Validation Rules Summary

| Field | Validation Rules | Error Messages |
| --- | --- | --- |
| Name | Required, alphabetic characters and | "Name is required" / "Name must not |
|   | spaces only, 2–100 characters | contain numbers or special |
|   |   | characters" |
| Phone Number | Required, exactly 10 consecutive | "Phone Number is required" / "Phone |
|   | numeric digits | Number must be exactly 10 digits |
|   |   | long" |
| Email | Required, valid email format, unique | "Please enter a valid email address" / |
|   | per account | "This email is already registered" |
| Password | Minimum 8 characters with | "Password must meet security |
|   | uppercase, lowercase, digit, and | requirements" |
|   | special character |   |
| Area (sqft) | Positive decimal | "Area must be a positive number" |
| Tax Amount | Non-negative decimal | "Tax amount must be non-negative" |


## Appendix D: Security Implementation Details

## JWT Configuration:

- Token Expiration: 8 hours for regular users, 12 hours for staff, 24 hours for admins

- Refresh Token: 30-day validity with automatic rotation on each use

- Algorithm: HS256 with minimum 256-bit secret key stored as environment variable

- Secret Key: Never hardcoded in source code — loaded from secure environment config

- Token Blacklisting: Implemented for logout, password change, and security breaches

- Token Claims: Include userId, role, email, issuedAt, and expiration timestamp

## Password Policy:

- Minimum 8 characters with uppercase, lowercase, digit, and special character

- Cannot match last 5 passwords; expires 90 days staff / 180 days users

- Lockout 15 minutes after 5 consecutive failed login attempts

- Secure password reset via email OTP with 15-minute validity window

- Password strength indicator displayed in real time during registration

## Data Security:

- Sensitive property tax management data encrypted at rest using AES-256

- All communications use HTTPS with TLS 1.3 and HSTS headers

- Server-side input sanitisation preventing SQL injection and XSS

- Role-scoped data access controls enforced at service layer

- Tamper-evident encrypted audit logs for all security events

## Rate Limiting:

- Login: maximum 5 attempts per 15-minute window per IP address

- Registration: maximum 3 new accounts per day per IP

- Search: maximum 1,000 queries per hour per authenticated user

- Data writes: maximum 100 operations per hour per user

- Password reset: maximum 3 emails per hour per address

## Appendix E: Exception Handling Classes

The following custom exception classes shall be implemented in com.examly.springapp.exception:

## InvalidNameException

Thrown when a property tax management name field contains non-alphabetic characters or digits.

- Extends: RuntimeException

- Trigger: Non-alphabetic characters in name field

- HTTP Status: 400 Bad Request

## InvalidPhoneException

Thrown when a phone number is not exactly 10 consecutive digits.

- Extends: RuntimeException

- Trigger: Phone not exactly 10 digits

- HTTP Status: 400 Bad Request


## DuplicatePropertyException

Thrown when a property tax management record with the same unique identifier already exists.

- Extends: RuntimeException

• Trigger: Duplicate unique identifier on create

• HTTP Status: 409 Conflict

## UnauthorisedAccessException

Thrown when a user accesses a resource outside their assigned role.

• Extends: RuntimeException

• Trigger: API call beyond user role permissions

- HTTP Status: 403 Forbidden

## ResourceNotFoundException

Thrown when a property tax management record cannot be found by the provided ID.

• Extends: RuntimeException

• Trigger: GET/PUT/DELETE with non-existent ID

• HTTP Status: 404 Not Found

## Appendix F: Business Rules and Constraints

## Property Rules:

- All mandatory property fields must pass validation before submission

- Name must contain alphabetic characters and spaces only — no digits or special characters

- Phone number must be exactly 10 consecutive numeric digits

- Duplicate property detection prevents creation of records with the same unique identifier

- Status changes are logged with the responsible user identity and timestamp

## Data Retention:

- Operational records retained per applicable regulatory requirement

- Audit logs retained for 7 years minimum

- Archived records accessible in read-only mode

- Data deletion procedures documented and verified annually

## Appendix G: Future Enhancement Roadmap

## Phase 2 Features:

- Native iOS and Android apps with offline property tax management capability

- Advanced analytics with machine learning trend forecasting

- Third-party platform integration via REST and webhook APIs

- Automated recommendation algorithms reducing manual work

- Multi-language support for diverse user populations

## Phase 3 Features:

- AI for automated pre-screening and intelligent workflow routing

- Predictive analytics for outcome forecasting

- Blockchain-based immutable record management

- Real-time collaborative workspaces with co-editing


## Phase 4 Features:

- Continuous ML retraining pipelines from production data

- Self-service BI with drag-and-drop report builder

- AI-assisted data extraction reducing manual entry by 80%

- Open partner API marketplace for third-party extensions

## Appendix H: API Endpoint Summary

## Property and Tax:

- POST /api/properties

- GET /api/properties/{id}

- GET /api/properties/{id}/assessment

- POST /api/payments/initiate

- GET /api/payments/receipt/{id}

## Administration:

- POST /api/assessments/run

- PUT /api/exemptions/apply

- POST /api/notices/generate

- GET /api/analytics/collection

- GET /api/defaulters/list

## NOC:

- POST /api/noc/request

- GET /api/noc/{id}/status

- PUT /api/noc/{id}/issue

## Auth:

- POST /api/auth/register

- POST /api/auth/login

- POST /api/auth/logout

- GET /api/users/profile

## Appendix I: Component and Navigation Structure

## React Components:

## App.jsx:

- React Router DOM v6 with nested and protected route support

- Routes: "/" (Home), "/login" (Login), "/register" (Register), "/dashboard" (Dashboard), "/property" (PropertyPortal)

- NavBar and Footer in root layout for all pages

- ProtectedRoute redirects unauthenticated users to login

- Global ErrorBoundary for unhandled runtime exceptions

## NavBar.jsx:

- Application title: "Smart Municipal Property Tax Management System"


- Navigation links: "Home" (/), "Login" (/login), "Register" (/register), "Dashboard" (/dashboard), "Property" (/property)

- Logged-in user name and role from JWT token in AuthContext

- Logout clears JWT from localStorage and redirects to login

- CSS classes: nav-link, nav-active, nav-brand

## Login.jsx:

- Email/username and password with show/hide toggle

- Submit "Login" → POST /api/auth/login

- JWT stored in localStorage; role saved in AuthContext on success

- Redirects to role-specific dashboard from JWT role claim

- Error: "Invalid credentials. Please check your email and password."

## Register.jsx:

- Multi-step form: name, email, phone, role, domain-specific fields

- Name: alphabetic + spaces only; Phone: exactly 10 digits

- Email uniqueness verified via debounced API call

- Submit "Register" → POST /api/auth/register

- Success: "Registration successful! Please verify your email."

## Dashboard.jsx:

- Role-aware cards, panels, and data tables per authenticated role

- KPI summary cards for most relevant metrics per role

- Recent activity feed with links to detail pages

- Quick-action buttons for three most-used operations

- Responsive CSS grid: single-column mobile, three-column desktop

## Footer.jsx:

- "© 2024 Smart Municipal Property Tax Management System. All rights reserved."

- Rendered via App.jsx layout — not imported individually

- Links to privacy policy, terms of service, and support

## Document Version Control

| Version | Changes | Author |
| --- | --- | --- |
| 1.0 | Initial SRS document creation for Smart Municipal Property Tax | Development Team |
|   | Management System |   |
