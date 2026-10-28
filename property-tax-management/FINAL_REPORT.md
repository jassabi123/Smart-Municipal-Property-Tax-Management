# Smart Municipal Property Tax Management System — Final Report

## Status

The backend now compiles and packages with Java 17, starts against local PostgreSQL, serves OpenAPI documentation, and passes the existing automated suite after one stale test expectation was aligned with the corrected security policy. A Vite React frontend has been added under `frontend/`, uses Axios with a central JWT interceptor, uses React Router, uses Tailwind CSS, and loads live backend data rather than seeded mock records.

| Check | Result | Evidence |
|---|---:|---|
| Backend package | PASS | `./mvnw -DskipTests package` exit 0 |
| Backend tests | PASS | 39 tests, 0 failures, 0 errors |
| PostgreSQL | PASS | local `tax_db`, `pg_isready` accepted |
| Backend runtime | PASS | `http://localhost:8080` |
| Swagger/OpenAPI | PASS | `http://localhost:8080/swagger-ui/index.html`, `/v3/api-docs` HTTP 200 |
| Frontend production build | PASS | `npm run build` exit 0 |
| Frontend runtime | PASS | `http://localhost:5173` HTTP 200 |
| Real registration/login/profile/logout flow | PASS | PostgreSQL-backed curl verification |
| CORS preflight | PASS | `Access-Control-Allow-Origin: http://localhost:5173` |
| Owner-to-admin restriction | PASS | owner token receives JSON HTTP 403 |

## Backend audit findings and fixes

The original baseline had no JDK compiler available in the execution environment, so Maven failed with `release version 17 not supported`. Installing OpenJDK 17 resolved the environment issue without changing the project target. The supplied historical run log also showed a PostgreSQL startup failure because the configured database did not exist.

The source contained committed fallback database and JWT secrets. `application.properties` now requires `DB_USERNAME`, `DB_PASSWORD`, and `JWT_SECRET` through environment variables. `CORS_ALLOWED_ORIGINS` is configurable and defaults only to the local frontend origin.

Public registration accepted a `role` field and previously persisted it directly, allowing a caller to request `ADMIN` or another privileged role. The existing request field remains accepted for compatibility, but `UserServiceImpl` now always persists `PROPERTY_OWNER` for public registration. Privileged roles must be assigned through an administrative workflow or database provisioning.

Security now returns clean JSON for both unauthenticated and unauthorized requests. JWT validation, expiration, role claims, and in-memory blacklist behavior were exercised through the live flow. The current blacklist is process-local; it is suitable for a single running instance but should be moved to a shared store before horizontal scaling.

## Verified API inventory

The inventory below is derived from controller mappings and Swagger, not invented routes. Full route evidence is preserved in `api-inventory-verified.txt`.

| Feature | Methods and paths | Authorization |
|---|---|---|
| Auth | `POST /api/auth/register`, `POST /api/auth/login`, `POST /api/auth/logout` | Register/login public; logout authenticated |
| Properties | `GET /api/properties`, `GET /api/properties/{id}`, `GET /api/properties/{id}/assessment`, `POST /api/properties`, `PUT /api/properties/{id}`, `DELETE /api/properties/{id}` | Reads authenticated; create/update ward officer, tax assessor, admin, commissioner; delete admin/commissioner |
| Assessments | `GET /api/assessments`, `GET /api/assessments/{id}`, aliases under `/api/tax-assessments`; `POST`, `PUT`, `DELETE`; assessment run POST | Reads authenticated; writes restricted to configured assessor/admin/commissioner roles |
| Payments | `POST /api/payments/initiate`, `GET /api/payments/{id}`, `GET /api/payments/receipt/{receiptNo}`, `GET /api/payments/assessment/{assessmentId}` | Authenticated |
| Exemptions | `POST /api/exemptions`, `PUT /api/exemptions/apply`, `GET /api/exemptions/{id}`, `GET /api/exemptions/property/{propertyId}`, `PUT /api/exemptions/{id}`, `DELETE /api/exemptions/{id}` | Reads authenticated; writes restricted by controller annotations |
| NOC | `POST /api/noc/request`, `GET /api/noc/{id}/status`, `PUT /api/noc/{id}/issue`, `GET /api/noc/property/{propertyId}`, `GET /api/noc/my/{userId}` | Authenticated; issue restricted to ward officer/commissioner/admin |
| Notices | `POST /api/notices/generate`, `GET /api/notices`, `GET /api/notices/{id}`, `PUT /api/notices/{id}/status` | Reads authenticated; writes restricted to ward officer/tax assessor/admin/commissioner |
| Notifications | `GET /api/notifications`, `GET /api/notifications/unread`, `PUT /api/notifications/{id}/read` | Authenticated |
| Users | `GET /api/users/profile`, admin `GET /api/users`, `GET /api/users/{id}`, activation/deactivation PUT routes | Profile authenticated; management admin only |
| Analytics | `GET /api/analytics/collection`, `GET /api/defaulters/list` | Collection route restricted by HTTP security to commissioner/admin/finance officer; defaulters additionally allows tax assessor |
| Audit | `GET /api/audit/user/{userId}`, `/entity/{entityType}/{entityId}`, `/action/{action}` | Admin only |

Swagger is available at `http://localhost:8080/swagger-ui/index.html` while the backend process is running.

## Frontend

The frontend is in `frontend/` and includes the requested Vite React structure in functional form through `src/api`, routed page components, shared layout/auth logic, and Tailwind styling. It provides Landing, Login, Registration, Dashboard, Properties, Tax Assessments, Tax Payments, Exemptions, NOC Requests, Notices, Notifications, Profile, Admin User Management, Audit Logs, and Analytics routes. Navigation is role-aware, direct access is checked against the role menu, loading/empty/error states are present, and public registration clearly states that it creates a `PROPERTY_OWNER` account.

The Axios client reads `VITE_API_BASE_URL`, attaches `Authorization: Bearer <JWT>`, redirects on HTTP 401, and surfaces backend messages for 400, 403, 404, 409, and 500 responses. The payment page explicitly states that the backend endpoint records initiation data and is **not a real payment gateway**.

## What was actually tested

A real PostgreSQL database was created and started locally. A property owner was registered with a request that attempted to submit `ADMIN`; the returned and persisted role was `PROPERTY_OWNER`. Login returned a JWT, profile returned HTTP 200, the admin user-management endpoint returned JSON HTTP 403, malformed registration returned JSON HTTP 400, CORS preflight returned HTTP 200 with the frontend origin, logout returned HTTP 200, and the same JWT returned HTTP 401 after blacklist invalidation.

The backend automated suite ran all 39 tests successfully. The frontend production bundle transformed 79 modules and completed successfully. Both runtime roots returned HTTP 200. Swagger returned HTTP 200 and exposed 42 unique `/api/` path entries in the generated document.

## Remaining issues and exact next steps

The backend does not expose a general list route for every requested page. NOC, exemptions, notices, and payments expose parameterized or workflow-specific routes rather than universal list/create contracts. The frontend therefore presents live responses and empty/error states for those pages; it does not fabricate records or endpoints. To provide full list/search/filter/pagination behavior, add verified backend query endpoints and DTOs first, then wire those exact paths into the corresponding page.

The current frontend feature form is intentionally generic and is not yet a complete domain-specific CRUD editor for every DTO. Properties, assessments, exemptions, notices, and NOC workflows should receive exact field-level forms after their controller DTO contracts are selected. The existing backend has no universal user update/profile-edit route, so the Profile page can only consume the real profile read endpoint until that backend capability is added.

Analytics is role-restricted by the backend. A property-owner dashboard request to the analytics endpoint correctly receives 403; the dashboard reports that live API error rather than substituting mock metrics. A production-quality dashboard should use a backend route permitted for the owner role or conditionally omit restricted analytics cards.

For a clean restart, run PostgreSQL, export the variables in `.env.example`, start the backend with `./mvnw spring-boot:run` from the project root, and start the frontend with `npm install && npm run dev -- --host 0.0.0.0` from `frontend/`.

## SRS enhancement update

The local development profile now includes an idempotent `DevelopmentDataSeeder`, enabled by `SEED_DATA=true` and controlled by `SEED_PASSWORD`. It creates clearly synthetic records only when the local seed flag is enabled: one account for each available role (`GUEST`, `PROPERTY_OWNER`, `TAX_ASSESSOR`, `WARD_OFFICER`, `ADMIN`, `COMMISSIONER`, and `FINANCE_OFFICER`), plus properties, assessments, payments, an exemption, an NOC request, an arrear notice, and an in-app notification. Production deployments should set `SEED_DATA=false` and provide `SEED_PASSWORD` only through the environment.

All seeded demo accounts use the local email pattern `demo.<role>@municipal.local` and the configured development password, defaulting to `Demo@1234`. Public registration still creates a `PROPERTY_OWNER`; users cannot self-assign privileged operational roles. JWT authentication, role claims, API-level `401`/`403` handling, and logout blacklisting remain enforced.

The frontend now exposes a top-right account button with the current user’s initial, role, and email. Its dropdown contains `My profile` and `Log out`. Logout calls `POST /api/auth/logout`, clears the local JWT and user state, and navigates to the public login/landing flow. The live dashboard reflected seeded API data with total assessed `108000`, total collected `31000`, total pending `77000`, and `3` properties. The account dropdown and logout were exercised in the browser successfully.

### Local demonstration

Start PostgreSQL, then run the backend with `SEED_DATA=true`, `SEED_PASSWORD=Demo@1234`, the database environment variables, and a JWT secret. Run the frontend with `VITE_API_BASE_URL=http://localhost:8080`. Sign in with any `demo.<role>@municipal.local` account to see role-specific navigation. Use the top-right account control to open the dropdown, visit the profile, or log out. The seed is idempotent and does not create duplicate records on subsequent restarts.


## Property-owner perspective update

Property-owner property reads are now scoped in the backend to the authenticated owner identity. A signed-in owner cannot use an arbitrary `ownerId` query parameter or property ID to read another owner’s property or property assessments; out-of-scope access returns `403`. The owner dashboard keeps the live property collection as its permitted summary source, while administrator and finance roles retain their authorized analytics views.

The seeded owner account `demo.owner@municipal.local` now sees two live properties belonging to `Demo Owner`: `SEED-HOME-001` at `14 Green Avenue` and `SEED-SHOP-002` at `8 Market Street`. The owner UI shows only the owner navigation set: Dashboard, Properties, Tax Assessments, Tax Payments, NOC Requests, Notifications, and Profile. The live browser verification displayed both seeded properties in the Properties page and showed the owner role in the top-right account control.


## Latest owner visibility and RBAC verification

The previous owner dashboard was technically calling the permitted property endpoint, but it only displayed a generic record count. It now renders owner-specific property cards containing the property identifier, address, construction type, ward, and assessed value. The live `PROPERTY_OWNER` dashboard displayed two records: `SEED-HOME-001` and `SEED-SHOP-002`. The owner Properties page also displayed both records in a table.

The owner’s seeded NOC request previously returned HTTP 500 because the response mapper accessed lazy relations outside a transaction. The NOC read methods now use read-only transactions, and `/api/noc/my/3` returns the seeded pending NOC as JSON with HTTP 200.

The live RBAC matrix was exercised with all seeded roles. Every role could authenticate and read permitted properties. Only `ADMIN` could read `/api/users`; `FINANCE_OFFICER`, `COMMISSIONER`, and `ADMIN` could read `/api/analytics/collection`; owner, assessor, ward officer, and guest received HTTP 403 for those restricted routes. The frontend navigation was role-specific for each account.


The owner Tax Assessments page now composes the existing property and property-assessment APIs and displays two live records: the paid home assessment of 18500 and the defaulted shop assessment with tax 62000, penalty 2500, and total due 64500. The owner Tax Payments page composes the existing assessment and payment APIs and displays the seeded UPI payment of 18500 with transaction `SEED-TXN-HOME-001` and receipt `SEED-RCP-001`. The page clearly states that this is a backend payment record and not a connected payment gateway.


## Attached-content fixes

The Exemptions form now sends the exact `ExemptionRequest` fields `propertyId`, `exemptionType`, `percentage`, `validFrom`, `validTo`, and `approvedById`, using the existing `PUT /api/exemptions/apply` endpoint. The Notices form now sends `propertyId`, `issuedById`, `noticeType`, and `message` to the existing `POST /api/notices/generate` endpoint. The generic frontend request handler now supports the correct HTTP method for exemption application.

The Admin User Management page now loads the existing user list and provides Activate and Deactivate actions using `PUT /api/users/{id}/activate` and `PUT /api/users/{id}/deactivate`, with feedback and list refresh. The Audit Logs page now supports the existing action, user, and entity filters. Audit read methods were corrected to map lazy user relations within read-only transactions, eliminating the reproduced CREATE-log HTTP 500.

The final verification passed with backend tests exit 0, frontend build exit 0, OpenAPI HTTP 200, frontend HTTP 200, admin audit CREATE HTTP 200, admin user list HTTP 200, owner properties HTTP 200, exact exemption creation HTTP 201, and exact notice creation HTTP 201. The project remains an academic prototype; excluded advanced SRS items such as real payment gateways, OTP, SSO, 2FA, SMS/email delivery, WebSockets, and external government integrations remain intentionally unimplemented.


## Second attached requirements applied

The second attached requirements file confirmed the existing fixes and required no unnecessary rewrite. The implementation was tightened so Exemption and Notice form controls use appropriate date and numeric input types, and the submitted Exemption payload converts `propertyId`, `percentage`, and `approvedById` to numeric JSON values while preserving ISO date strings. Notice IDs are also sent as numeric JSON values.

The existing Audit Logs page is connected to the three backend filter families and remains ADMIN-only. The existing Admin User Management page uses the backend activate/deactivate methods, reports success or failure, and reloads the user list after each action. JWT security, `@PreAuthorize`, password hashing, and public registration restrictions were preserved. No excluded advanced SRS feature was introduced.

Final checks after this application: frontend Vite build exit 0; backend test exit 0 with all existing test reports showing zero failures and zero errors; OpenAPI HTTP 200; frontend HTTP 200; exact exemption request HTTP 201; exact notice request HTTP 201; audit CREATE query HTTP 200; admin users query HTTP 200; and owner property query HTTP 200.
