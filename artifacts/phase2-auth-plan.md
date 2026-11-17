# Phase 2 — Authentication Foundation (Module Plan)

This plan details the Phase 2 authentication slice defined in `artifacts/plan.md`, based on `artifacts/requirements.md`. It establishes HR-only access, the `User` model, and the auth infrastructure that subsequent modules will build on. Minor implementation details may be refined during development.

## 1. Scope and goals

- Introduce the **`User`** model as the HR login/provisioning account (separate from the `Employee` domain record implemented later).
- Provide **HR-only, invite-based access**: no open self-registration; only authenticated HR users can access protected resources and provision other HR users.
- Expose **JSON/JWT-based authentication** suitable for a separate React SPA, with sign-in, sign-out, password reset, and invite acceptance (set-password) flows.
- Wire **frontend auth** (login/reset/invite screens, token handling, route guarding) so the protected app shell is accessible only to signed-in HR users.
- Deliver **core, deterministic tests** for auth behavior and endpoint protection.

### Out of scope
- Roles/permissions beyond “authenticated HR user” (and the `@official.com` HR constraint).
- Linking `User` to `Employee` (Employee is a separate module/record).
- Two-factor authentication and third-party (OAuth/SSO) login.
- Production email delivery (development uses a local mailer).

### Acceptance criteria
- `hr@official.com` can be seeded and can sign in.
- An authenticated HR user can provision/invite another `@official.com` HR user; a non-authenticated or unauthorized request cannot.
- An invited HR user can set a password via the invite flow and then sign in.
- A signed-in user receives a JWT, can access protected `/v1` endpoints, can reset their password, and can sign out (token revoked).
- Unauthenticated requests to protected `/v1` endpoints are rejected (401/unauthorized).
- All non-auth frontend routes require authentication; unauthenticated users are redirected to login; 401 responses clear the session.

## 2. Prerequisites

- **Fix JSON rendering:** resolve the current `json` gem / `render json` (`ArgumentError: unknown keyword: quirks_mode`) incompatibility so controllers can return JSON consistently (update/pin a compatible `json` gem or equivalent fix). Remove the temporary `render plain` workaround in `V1::HealthController` once resolved.
- **Environment:** backend (`/backend`, Rails API, MySQL) and frontend (`/frontend`, React + MUI) run and communicate (Phase 1 complete). CORS already allows dev origins and exposes `Authorization`.

## 3. Backend design

### 3.1 User model & database

- **Table `users`** (Devise-backed):
  - `id` (bigint, PK)
  - `email` (string, required, unique, indexed)
  - Devise fields as needed: `encrypted_password`, `reset_password_token` (unique), `reset_password_sent_at`, `remember_created_at`, trackable timestamps/fields (e.g. `sign_in_count`, `current_sign_in_at`, `last_sign_in_at`, `current_sign_in_ip`, `last_sign_in_ip`) per requirements, and timestamps (`created_at`, `updated_at`).
  - JWT revocation support (see §3.2), e.g. a `jti` (string, unique, indexed, required) when using a JTI/denylist strategy.
  - Invite/activation support: fields required by the chosen Devise invitable/reset flow (e.g. invitation token/sent/accepted timestamps or reuse of reset-password token semantics) so a provisioned user can set an initial password.
- **Validations/rules:**
  - `email` present, unique (case-insensitively normalized), and must end with `@official.com`.
  - Password required/validated on set/reset/accept (Devise defaults, configurable length).
- **Seed:** create/ensure `hr@official.com` as an active, sign-in-capable HR user for initial provisioning. In **development**, seed with a known dev-only default password (e.g. from `SEED_HR_PASSWORD`, falling back to a documented dev default such as `Password123!` only when `Rails.env.development?`); in non-development environments, require the password from credentials/env. The frontend shows a dev-only login hint with these credentials when running in development mode (see §4.2).

> Exact Devise modules and invite-token columns are finalized at implementation to fit the chosen flow, while preserving the behaviors above.

### 3.2 Authentication & JWT

- **Gem/strategy:** `devise` + `devise-jwt` for stateless JWT authentication, with a **revocation strategy** (e.g. denylist or JTIMatcher) so sign-out invalidates tokens (immediately, regardless of expiry).
- **Transport:** client authenticates with `Authorization: Bearer <token>`. Tokens are issued on successful sign-in (and, if applicable, activation) and returned in the **`Authorization` response header** (per `devise-jwt` convention) **and** in the JSON response body for reliable client consumption.
- **Expiry:** configurable via credentials/environment, with a sensible default of **24 hours**. (Refresh tokens are out of scope; revocation covers explicit sign-out.)
- **Configuration:** JWT secret, dispatch/revocation, and expiry configured via Rails credentials/environment. Request/response formats JSON. CORS continues to expose `Authorization`.
- **Authorization (Phase 2):** all non-auth resource endpoints require an authenticated `User` (HR), except `GET /v1/health` which remains **public** (connectivity check). `POST /v1/users` (and provisioning actions) require an authenticated HR user. No open self-registration endpoint is exposed.

### 3.3 Mailer (development)

- **Local delivery:** configure Action Mailer for development with **`letter_opener`** (and optionally `letter_opener_web`) so invite and password-reset emails are captured and viewable locally (no external provider).
- **Emails:** invite/set-password email and password-reset email containing the appropriate token/link to the frontend route. Content kept minimal and functional.

### 3.4 API contract (under `/v1`, JSON)

All endpoints are prefixed `/v1` and return JSON. Error responses use a consistent shape (e.g. `{ "error": "...", "details": ... }` or `{ "errors": [...] }`) with appropriate HTTP status codes (401 unauthenticated, 403/unauthorized where applicable, 422 validation, etc.).

#### Auth
| Method | Path | Auth | Purpose | Request (body) | Success response |
|---|---|---|---|---|---|
| POST | `/v1/auth/sign_in` | No | Sign in | `{ "user": { "email", "password" } }` | 200 with user `{ id, email }` and JWT issued (in `Authorization` header and JSON body) |
| DELETE | `/v1/auth/sign_out` | Yes | Sign out / revoke token | — | 200/204, token revoked |
| POST | `/v1/auth/password` | No | Request password reset | `{ "user": { "email" } }` | 200 (generic response to avoid user enumeration) + reset email via letter_opener |
| PATCH/PUT | `/v1/auth/password` | No (token) | Set new password via reset token | `{ "user": { "reset_password_token", "password", "password_confirmation" } }` | 200 on success |
| PUT/PATCH | `/v1/auth/invitation` | No (token) | Accept invite / set initial password | `{ "user": { "invitation_token", "password", "password_confirmation" } }` | 200 on success (user may then sign in) |

**Token/route alignment:**
- **Password reset:** email links to the frontend `/password/reset?reset_password_token=<token>`; the page submits `reset_password_token` to `PATCH/PUT /v1/auth/password`.
- **Invite acceptance:** a dedicated flow, separate from password reset. The invite email links to the frontend `/invitation/accept?invitation_token=<token>`; the page submits `invitation_token` to `PUT/PATCH /v1/auth/invitation`. (Internally this may reuse Devise token machinery as convenient, but the endpoint, param name, and frontend route/query param must match as specified.)

> Exact response envelopes are finalized to match the chosen Devise/devise-jwt wiring while preserving the behaviors above.

#### User provisioning (HR-only)
| Method | Path | Auth | Purpose | Request (body) | Success response |
|---|---|---|---|---|---|
| GET | `/v1/users` | Yes (HR) | List HR users | pagination params (`page[number]`, `page[size]`) as applicable | 200 with paginated user list (id, email, timestamps) |
| POST | `/v1/users` | Yes (HR) | Provision/invite an HR user | `{ "user": { "email" } }` (`@official.com`) | 201 with created user (pending activation) and invite email dispatched |

- `POST /v1/users` creates the account in an invited/pending state (no usable password) and triggers the invite email. It must **not** be publicly accessible.
- No open self-registration route is exposed.

### 3.5 Flows

- **Sign-in:** valid `@official.com` credentials for an active user → JWT issued; invalid → 401.
- **Provision/invite:** authenticated HR creates `@official.com` user → invite token generated, invite email delivered via letter_opener (dev) → invitee sets password through invite acceptance → account becomes active/sign-in-capable.
- **Password reset:** user requests reset by email (generic response) → reset email via letter_opener → user submits token + new password → password updated.
- **Sign-out:** authenticated request revokes the JWT so it can no longer be used.
- **Protection:** missing/invalid/revoked token on protected endpoints → 401.

## 4. Frontend design

### 4.1 Routes & screens
- **Public (unauthenticated):**
  - `/login` — sign-in form (email, password).
  - `/password/forgot` — request password reset (email).
  - `/password/reset` — set new password via `reset_password_token` (read from query string).
  - `/invitation/accept` — set initial password via `invitation_token` (read from query string).
- **Protected (authenticated HR):** existing app shell/layout and all current/future feature routes (e.g. `/` dashboard and subsequent module pages). Unauthenticated access redirects to `/login`.

`GET /v1/health` remains public, so the existing frontend connectivity check continues to work without authentication.

### 4.2 Auth state & API integration
- **API client (`src/api/client.js`):** attach `Authorization: Bearer <token>` to requests when present; centralize 401 handling to clear session and redirect to login (preserving/handling redirect-back is optional).
- **Token/user storage:** store JWT (and minimal user info, e.g. email/id) client-side in `localStorage` with helpers to get/set/clear; restore session on load when a token is present.
- **Auth context/provider:** expose current user, auth status, and actions (`signIn`, `signOut`, request/reset password, accept invitation) to the app; guard protected routes based on auth state.
- **Dev login hint:** when running in development mode (`import.meta.env.DEV`), show an info notice on the login page with the seeded HR credentials (e.g. `hr@official.com` and the dev-only default password, matching the backend seed/dev config) to simplify local access. This hint must not appear in production builds.
- **UX:** loading/error states for auth actions, validation feedback for forms, and confirmation messaging (e.g. reset/invite email sent, password set).

### 4.3 Configuration
- Frontend targets backend `VITE_API_BASE_URL` (default `http://localhost:3001/v1`). Dev email links from letter_opener should resolve to the corresponding frontend routes/tokens as configured.

## 5. Testing (core, fast, deterministic)

- **Model/unit (`User`):** email presence/uniqueness and `@official.com` format validation, normalization, and basic Devise behaviors relevant to the configured modules.
- **Request/API:**
  - Sign-in success (returns token in header and body + user) and failure (invalid credentials, non-`@official.com`/inactive as applicable).
  - Sign-out revokes token (subsequent authenticated request rejected).
  - Password reset request and reset-with-token success/failure cases.
  - Invite acceptance/set-password success (via `invitation_token`) and invalid/expired token handling.
  - Provisioning: `POST/GET /v1/users` succeed for authenticated HR and are rejected (401) for unauthenticated requests; validation errors (e.g. invalid/non-official email) return 422.
  - Protected resource endpoints reject missing/invalid/revoked tokens (401); `GET /v1/health` remains public and accessible without authentication.
- **Mailer:** invite and reset emails are enqueued/delivered (letter_opener in dev; testable via Action Mailer test helpers) with correct recipients/tokens/links.
- **Determinism:** no external network dependencies; fixed secrets/config in test env; time/token-dependent cases handled with appropriate helpers.

## 6. Implementation steps (suggested order)

1. **Fix JSON rendering** (backend): resolve `json`/ActiveSupport incompatibility and restore standard JSON rendering.
2. **Dependencies & config:** add `devise`, `devise-jwt` (and revocation support), and `letter_opener`/`letter_opener_web` for development; configure Devise (API/JSON), JWT (dispatch/revocation/secret/expiry), mailer (dev), and CORS as needed.
3. **User model & migration:** create `users` with Devise, trackable, revocation, and invite/reset fields; add validations (`@official.com`, uniqueness) and seed `hr@official.com`.
4. **Auth & provisioning endpoints:** implement `/v1/auth/*` (sign-in/out, password reset, invite accept) and protected `/v1/users` (index/create) with JSON responses and consistent error handling.
5. **Endpoint protection:** enforce authenticated HR access on protected `/v1` resources; keep `GET /v1/health` public and apply authentication globally to resource controllers as they are added.
6. **Frontend auth:** API client token/401 handling, auth state/provider, public auth screens, protected route guarding, and logout; wire flows to backend endpoints.
7. **Tests:** model, request (auth/provisioning/protection), and mailer coverage; ensure suite is fast and deterministic.
8. **Verification:** manual end-to-end pass (seed → sign-in → provision/invite via letter_opener → accept invite/set password → sign-in → reset password → sign-out → protected-route rejection) and update docs/env notes as needed.

## 7. Finalized decisions

- **Token:** configurable expiry (default **24 hours**); JWT returned in the **`Authorization` response header** and in the JSON response body on sign-in.
- **Health endpoint:** `GET /v1/health` remains **public** (frontend connectivity check unchanged).
- **Invite acceptance (separate from reset):** `PUT/PATCH /v1/auth/invitation` with `invitation_token` (+ password/confirmation); invite email links to frontend `/invitation/accept?invitation_token=<token>`. Password reset remains `POST`/`PATCH|PUT /v1/auth/password` with `reset_password_token` and frontend `/password/reset?reset_password_token=<token>`.
- **Seeded HR dev access:** in development, seed `hr@official.com` with a dev-only default password (e.g. `SEED_HR_PASSWORD` or a documented fallback only in dev); show a dev-only login hint in the frontend (`import.meta.env.DEV`). Non-development requires credentials/env-provided password.
- **Auth contract baseline:** endpoints and behaviors as specified in §3.4 (naming/response envelopes aligned to the chosen Devise/devise-jwt wiring while preserving these behaviors).

**Minor implementation-level details to settle as needed:** exact response envelope/pagination metadata shape for `GET /v1/users`, and the concrete Devise modules/token columns used to implement the invite flow (consistent with the contract above).

---

**References:** `artifacts/requirements.md` (Objective, Features In/Out of Scope, Tech Stack, Authentication, User model/APIs, Frontend & UI) and `artifacts/plan.md` (Phase 2, integration conventions).
