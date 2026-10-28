# Verified API Inventory

This inventory is derived from the Spring MVC controllers, service interfaces, DTOs, security configuration, and the generated OpenAPI document. It does not add routes that are absent from source.

## Common behavior

Protected routes require `Authorization: Bearer <JWT>`. Successful writes use the status shown below. Validation failures return HTTP 400 with `{ timestamp, status, error, message }`; missing resources return HTTP 404; duplicate property or state conflicts return HTTP 409; invalid credentials or missing/invalid/expired/blacklisted JWTs return HTTP 401; insufficient roles return HTTP 403; unexpected failures return HTTP 500 with a generic message.

| Feature | Method and path | Auth / role | Request body or query | Success response |
|---|---|---|---|---|
| Authentication | `POST /api/auth/register` | Public | `RegisterRequest`: `name`, `phoneNumber`, `email`, `password`, `role` | 201 `AuthResponse`; public role is persisted as `PROPERTY_OWNER` |
| Authentication | `POST /api/auth/login` | Public | `LoginRequest`: `email`, `password` | 200 `AuthResponse` |
| Authentication | `POST /api/auth/logout` | Authenticated JWT | `Authorization` header | 200 message; token is blacklisted until expiry |
| Properties | `GET /api/properties` | Authenticated | Optional controller filters as implemented | 200 `List<PropertyResponse>` |
| Properties | `GET /api/properties/{id}` | Authenticated | Path `id` | 200 `PropertyResponse` |
| Properties | `GET /api/properties/{id}/assessment` | Authenticated | Path `id` | Controller-defined assessment response |
| Properties | `POST /api/properties` | `WARD_OFFICER`, `TAX_ASSESSOR`, `ADMIN`, `COMMISSIONER` | `PropertyRequest`: `propertyId`, `ownerId`, `address`, `wardNo`, `areaSqft`, `constructionType`, optional `assessedValue`, `lat`, `lng`, `status` | 201 `PropertyResponse` |
| Properties | `PUT /api/properties/{id}` | `WARD_OFFICER`, `TAX_ASSESSOR`, `ADMIN`, `COMMISSIONER` | `PropertyRequest` | 200 `PropertyResponse` |
| Properties | `DELETE /api/properties/{id}` | `ADMIN`, `COMMISSIONER` | Path `id` | 204 |
| Assessments | `POST /api/assessments` or `/api/tax-assessments` | `TAX_ASSESSOR`, `ADMIN`, `COMMISSIONER` | `TaxAssessmentRequest`: `propertyId`, `financialYear`, `taxAmount`, optional `penalty`, `totalDue`, `status`, `dueDate` | 201 `TaxAssessmentResponse` |
| Assessments | `POST /api/assessments/run` or `/api/tax-assessments/run` | `TAX_ASSESSOR`, `ADMIN`, `COMMISSIONER` | `TaxAssessmentRequest` | 201 `TaxAssessmentResponse` |
| Assessments | `GET /api/assessments/{id}` or alias | Authenticated | Path `id` | 200 `TaxAssessmentResponse` |
| Assessments | `GET /api/assessments` or alias | Authenticated | Optional `status`, `financialYear`; no filter returns pending assessments | 200 `List<TaxAssessmentResponse>` |
| Assessments | `PUT /api/assessments/{id}` or alias | `TAX_ASSESSOR`, `ADMIN`, `COMMISSIONER` | `TaxAssessmentRequest` | 200 `TaxAssessmentResponse` |
| Assessments | `DELETE /api/assessments/{id}` or alias | `ADMIN`, `COMMISSIONER` | Path `id` | 204 |
| Payments | `POST /api/payments/initiate` | Authenticated | `TaxPaymentRequest`: `assessmentId`, `amountPaid`, `paymentMode`, `transactionId` | 201 `TaxPaymentResponse` |
| Payments | `GET /api/payments/{id}` | Authenticated | Path `id` | 200 `TaxPaymentResponse` |
| Payments | `GET /api/payments/receipt/{receiptNo}` | Authenticated | Path `receiptNo` | 200 `TaxPaymentResponse` |
| Payments | `GET /api/payments/assessment/{assessmentId}` | Authenticated | Path `assessmentId` | 200 `List<TaxPaymentResponse>` |
| Exemptions | `POST /api/exemptions` | `FINANCE_OFFICER`, `ADMIN`, `COMMISSIONER` | `ExemptionRequest`: `propertyId`, `exemptionType`, `percentage`, `validFrom`, `validTo`, `approvedById` | Controller-defined exemption response |
| Exemptions | `PUT /api/exemptions/apply` | `FINANCE_OFFICER`, `ADMIN`, `COMMISSIONER` | Controller-defined request | Controller-defined response |
| Exemptions | `GET /api/exemptions/{id}` | Authenticated by HTTP security | Path `id` | Controller-defined response |
| Exemptions | `GET /api/exemptions/property/{propertyId}` | Authenticated by HTTP security | Path `propertyId` | Controller-defined response |
| Exemptions | `PUT /api/exemptions/{id}` | `FINANCE_OFFICER`, `ADMIN`, `COMMISSIONER` | `ExemptionRequest` | Controller-defined response |
| Exemptions | `DELETE /api/exemptions/{id}` | `ADMIN`, `COMMISSIONER` | Path `id` | 204 or controller-defined response |
| NOC | `POST /api/noc/request` | Authenticated | `NOCRequestDto`: `propertyId`, `requestedById` | 201 `NOCResponseDto` |
| NOC | `GET /api/noc/{id}/status` | Authenticated | Path `id` | 200 `NOCResponseDto` |
| NOC | `PUT /api/noc/{id}/issue` | `WARD_OFFICER`, `COMMISSIONER`, `ADMIN` | Controller-defined issue request | Controller-defined response |
| NOC | `GET /api/noc/property/{propertyId}` | Authenticated | Path `propertyId` | 200 NOC response/list |
| NOC | `GET /api/noc/my/{userId}` | Authenticated | Path `userId` | 200 NOC response/list |
| Notices | `POST /api/notices/generate` | `WARD_OFFICER`, `TAX_ASSESSOR`, `ADMIN`, `COMMISSIONER` | `NoticeRequest`: `propertyId`, `issuedById`, `noticeType`, `message` | Controller-defined notice response |
| Notices | `GET /api/notices` | Authenticated by HTTP security | Controller query parameters | 200 notice list |
| Notices | `GET /api/notices/{id}` | Authenticated by HTTP security | Path `id` | 200 notice response |
| Notices | `PUT /api/notices/{id}/status` | `WARD_OFFICER`, `TAX_ASSESSOR`, `ADMIN`, `COMMISSIONER` | Controller-defined status request | Controller-defined response |
| Notifications | `GET /api/notifications` | Authenticated | None | 200 `List<NotificationResponse>` |
| Notifications | `GET /api/notifications/unread` | Authenticated | None | 200 `List<NotificationResponse>` |
| Notifications | `PUT /api/notifications/{id}/read` | Authenticated | Path `id` | 200 `NotificationResponse` |
| Users | `GET /api/users/profile` | Authenticated | None | 200 `UserResponse` |
| Users | `GET /api/users`, `GET /api/users/{id}` | `ADMIN` | Path `id` for detail | 200 user list/detail |
| Users | `PUT /api/users/{id}/activate`, `/deactivate` | `ADMIN` | Path `id` | 200 `UserResponse` |
| Analytics | `GET /api/analytics/collection` | `COMMISSIONER`, `ADMIN`, `FINANCE_OFFICER` | None | 200 `Map<String,Object>` |
| Analytics | `GET /api/defaulters/list` | `COMMISSIONER`, `ADMIN`, `FINANCE_OFFICER`, `TAX_ASSESSOR` | None | 200 `List<TaxAssessmentResponse>` |
| Audit | `GET /api/audit/user/{userId}`, `/entity/{entityType}/{entityId}`, `/action/{action}` | `ADMIN` | Path parameters | 200 `List<AuditLogResponse>` |

## Request validation

Registration validates name characters and length, exactly ten phone digits, email format, and a password containing upper-case, lower-case, numeric, special, and at least eight total characters. Property requests validate required identifiers, positive area, and coordinate bounds. Assessment requests validate `financialYear` as `YYYY-YY`, non-negative amounts, and required property/year/tax fields. Payment requests validate a positive amount, payment mode, transaction ID, and assessment ID.
