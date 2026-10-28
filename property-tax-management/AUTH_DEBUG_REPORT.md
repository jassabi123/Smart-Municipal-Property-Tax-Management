# Authentication Debug Report

## Root cause

The supplied credential `sample.admin@municipal.local` did not exist in the active `tax_db` database. The live database contained the built-in development user `demo.admin@municipal.local`, but no row for the sample-admin email. The login request therefore reached the correct authentication endpoint and returned HTTP 401 because `UserRepository.findByEmail` could not find the sample user. This was a data-loading issue, not a JWT, BCrypt, AuthenticationManager, role-authority, CORS, or frontend URL defect.

The built-in `SEED_DATA=true` initializer creates `demo.*@municipal.local` accounts and does not create or conflict with the `sample.*@municipal.local` accounts from `sample_data.sql`.

## Fix applied

The existing verified `sample_data.sql` was loaded into the active `tax_db` database. It inserted the sample admin and the other synthetic sample users with the BCrypt hash verified against `Demo@1234`. No JWT or Spring Security source was removed or redesigned, and no database schema was changed.

## Authentication path verified

`POST /api/auth/login` accepts JSON with `email` and `password`. `AuthServiceImpl` delegates to the configured `AuthenticationManager`; `SecurityConfig` uses one `DaoAuthenticationProvider` with `CustomUserDetailsService` and one `BCryptPasswordEncoder`; `CustomUserDetailsService` maps the enum role to `ROLE_<ROLE>`; `JwtService` signs the returned token with `app.jwt.secret`; and `JwtAuthenticationFilter` validates the token, checks expiry and blacklist state, loads the user, and places authorities in the security context.

The frontend uses `VITE_API_BASE_URL` with fallback `http://localhost:8080` and sends the same request to `/api/auth/login`.

## Final verification

- Sample login: HTTP 200 with JWT returned.
- JWT payload: subject `sample.admin@municipal.local`, userId `1001`, role `ADMIN`, issued and expiry claims present.
- Protected admin endpoint `GET /api/users` with returned JWT: HTTP 200.
- Invalid token against `GET /api/users`: HTTP 401.
- CORS preflight from `http://localhost:5173` to the login endpoint: HTTP 200.
- Frontend browser login using the sample credentials: navigated to `/dashboard` and rendered live metrics.
- Backend tests: exit 0; all reports show zero failures and zero errors.
- Frontend production build: exit 0.

## Credentials

Email: `sample.admin@municipal.local`

Password: `Demo@1234`

## Commands

```bash
sudo -u postgres psql -d tax_db -f sample_data.sql
```

If running from a home directory that is not readable by the `postgres` OS user, copy the file to `/tmp` first or use a database login user with file access.
