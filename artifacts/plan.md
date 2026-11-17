# Implementation Plan

This plan outlines a broad, end-to-end roadmap for building the employee salary management software based on `artifacts/requirements.md`. It is intentionally high-level: each module will be planned in finer detail just before implementation.

## Goals and principles

- **End-to-end vertical slices:** build backend and frontend in parallel so each increment is runnable and verifiable against the real integration.
- **Incremental, dependency-aware progress:** implement modules one by one in an order that respects data and feature dependencies.
- **Core correctness first:** enforce schema constraints, validations, and business rules at the appropriate layers (database, model, API) and surface clear feedback in the UI.
- **Defer non-essential detail:** keep to the in-scope features and conventions defined in the requirements; refine minor implementation details during per-module planning.

## Current state

- Repository is initialized.
- High-level and technical requirements are defined in `artifacts/requirements.md`.

## Phase 1 — Parallel project setup (backend + frontend running)

Set up both applications so they run locally and can communicate with each other.

### Backend (`/backend`, Ruby on Rails + MySQL)
- Scaffold a Rails API-oriented application configured for MySQL.
- Configure environments, credentials/secrets handling, CORS, and JSON request/response behavior.
- Establish a versioned API namespace (`/v1`).
- Add and configure core dependencies (authentication/Devise with JWT-based JSON auth, validation/support gems such as `money` and `carmen`, and the test framework/tooling).
- Verify the server starts successfully and exposes a basic responsive endpoint.

### Frontend (`/frontend`, React + MUI)
- Scaffold a React application with the MUI component library.
- Set up routing, an application shell/layout (sidebar-ready), theme/providers, and environment-based configuration.
- Create a base API client layer for communicating with the backend (`/v1`), including request/response handling and error handling hooks.
- Verify the dev server starts successfully.

### Integration baseline
- Confirm frontend ↔ backend connectivity (including CORS and base URL configuration) with a simple end-to-end request.
- Establish shared conventions to carry through modules: JSON payload/error shape, pagination (`page[number]`, `page[size]`) and filtering (`filter[...]`) patterns, and authenticated request handling.

## Phase 2 — Authentication foundation (thin end-to-end slice)

Establish HR-only access early so subsequent modules are built behind the intended access model.

- **User/auth model (backend):** `User` with Devise-backed authentication, required/unique `@official.com` email, and JWT-based auth responding in JSON.
- **Auth flows:** sign-in, sign-out/token invalidation, password reset, and invite/activation (set-password) flow for provisioned HR members. Seed an initial HR account (`hr@official.com`).
- **Access control:** restrict user provisioning/creation to authenticated HR users (no open self-registration) and require a valid HR JWT for all non-auth resource endpoints.
- **Frontend:** login and reset/accept-invite screens, token storage and attachment to API requests, route guarding for authenticated areas, and logout/session-expiry handling.
- **Verification:** an HR user can sign in and access the protected application shell; unauthenticated access to protected resources is denied.

> Exact auth endpoint paths, token/session mechanics, and invite details will be finalized in the auth module plan.

## Phase 3 — Domain modules (end-to-end, one by one)

Implement modules in dependency order. For each module, complete a vertical slice: **database migration (schema, foreign keys, indexes/constraints) → model & associations → validations/business rules → `/v1` API endpoints (CRUD as in scope, filtering, pagination, errors) → frontend UI (navigation, list, detail, create/edit forms) → integration check**.

### Module 1 — Location
- **Purpose:** represent office locations (city, state, country) used by departments and for location-based filtering/analytics.
- **Backend:** `locations` schema and model; required fields and unique (city, state, country_code) combination; state/country validation (carmen); indexed fields as appropriate.
- **API:** list/show/create/update with pagination and relevant filtering.
- **Frontend:** location management views (list/detail/create/edit) and reusable selection for dependent modules.
- **Notes:** foundation for departments and location-based queries.

### Module 2 — Department
- **Purpose:** represent departments, their associated location, and (optionally) department head.
- **Backend:** `departments` schema and model; associations to `location` and optional `head_employee` (nullable for bootstrapping); required fields and unique (name, location); indexes as appropriate.
- **API:** list/show/create/update with pagination/filtering and resolved related data for display.
- **Frontend:** department management views, linking to locations (and head selection when employee data is available).
- **Depends on:** Location (and Employee reference for head, handled compatibly).

### Module 3 — Employee
- **Purpose:** manage employee profiles and employment details.
- **Backend:** `employees` schema and model; association to `department`; fields including employee code, name, contact (email, phone), dates, and job title; required/uniqueness rules (employee code, email, phone) and date rules (age ≥ 18, joining/last-working-day consistency, nullable last working day); indexed fields as appropriate.
- **API:** list/show/create/update with pagination and search/filtering (e.g. department, position/job title, office/location via relations).
- **Frontend:** employee directory (paginated/filterable), profile detail, and create/edit forms; no delete flow (per scope), with records preserved for history.
- **Depends on:** Department (and Location via relations).

### Module 4 — Salary (history & current compensation)
- **Purpose:** track salary records and history per employee, including current applicable compensation.
- **Backend:** `salaries` schema and model; associations to `employee` and `department`; components (base, HRA, bonus, deduction), `total_amount` (derived/validated as base+HRA+bonus−deduction), currency, monthly frequency, job title, and applicable period (`applicable_from`, nullable `applicable_till`).
- **Business rules:** base > 0 with other components ≥ 0; date validity (relative to joining and period ordering); open-ended current record; closing the previous record when a new one is added; and no overlapping applicable periods per employee.
- **API:** list/show/create/update with pagination and filtering; support viewing history per employee.
- **Frontend:** salary history per employee and forms to add/update records, reflecting current vs closed periods and validation feedback.
- **Depends on:** Employee and Department.

### Module 5 — Analytics
- **Purpose:** answer HR questions about pay through primary, per-currency aggregates.
- **Backend:** `GET /v1/salaries/analytics` returning total, average, and median of `total_amount` over **current applicable salaries** only (as defined in requirements).
- **Filtering & correctness:** support filters such as department id, location id, city, state, and job title (resolved via relations); raise a clear error on mixed-currency result sets, prompting the user to filter to a single currency.
- **Frontend:** analytics view with filter controls and display of aggregate results (and currency-mismatch/error states).
- **Depends on:** Salary (and related Department/Location/Employee data).

## Phase 4 — Tests (core functionality)

Consolidate meaningful, fast, deterministic coverage of core behavior (built up alongside modules where practical, completed here):
- **Model/unit tests:** validations, associations, salary calculations, current-period/overlap rules, and key edge cases.
- **Request/API tests:** authentication/authorization enforcement, core CRUD flows per resource, filtering and pagination behavior, and analytics correctness (current-salary scoping, aggregates, and mixed-currency handling).
- **Stability:** ensure the suite is reliable and suitable for repeated runs.

## Phase 5 — Seed data

- **Seed script:** reproducible, efficient (batched/bulk) generation of ~10K employees across multiple countries with associated locations, departments, and salary histories/current records in varied currencies.
- **Baseline accounts/data:** include the seeded initial HR user (`hr@official.com`) and a coherent dataset that exercises relationships and analytics.
- **Verification:** sanity-check record counts, relational integrity, and representative analytics queries against the seeded data.

## Phase 6 — Stabilization

- Perform an end-to-end pass of core HR workflows against seeded data (authentication, managing locations/departments/employees, salary history updates, and analytics).
- Resolve defects, refine validation/error messaging, and ensure consistent behavior across backend and frontend.
- Update project documentation (setup, run, test, and seed instructions) to reflect the implemented system.

## Per-module planning approach

Before implementing each phase/module above, create a focused module plan that captures:
- Scope and acceptance criteria for the slice.
- Detailed data contract (fields, constraints, indexes) and business rules/edge cases.
- API contract (endpoints, params/filters, request/response and error shapes).
- Frontend behavior (screens/components, states, interactions, validation feedback).
- Test cases to cover and any integration considerations with existing modules.

This keeps the overall roadmap stable while allowing fine-grained decisions to be made with full context at implementation time.
