# Phase 4 — Tests (Core Functionality) (Plan)

This plan details **Phase 4** from `artifacts/plan.md`: consolidate meaningful, fast, deterministic coverage of core behavior. It builds on the implemented modules (Auth/Users, Locations, Departments, Employees, Salaries, Analytics) and aligns with `artifacts/requirements.md`.

## 1. Scope and goals

- Provide **reliable, fast, deterministic** automated tests for core functionality (model/business rules and API/request behavior).
- Cover the highest-risk and most important behaviors: validations, associations, salary calculations and period rules, authentication/authorization, CRUD flows, filtering/pagination, and analytics correctness.
- Keep the suite maintainable and suitable for repeated local/CI runs.

### In scope
- **Model/unit tests:** validations, associations, normalization/derived values, salary calculations, current-period/overlap/auto-close rules, and key edge cases.
- **Request/API tests:** auth enforcement, core CRUD per resource, request/response shapes and error cases, filtering & pagination behavior, and analytics endpoint correctness (current-salary scoping, aggregates/median, filters, mixed-currency).
- **Test infrastructure:** helpers for authenticated requests (JWT), time control for “today/current” behavior, and shared setup utilities as needed.

### Out of scope (for now)
- Frontend/unit UI tests (explicitly deferred in requirements).
- Performance/load testing, browser/E2E tests.
- Exhaustive coverage of every permutation; focus on core behavior and critical edge cases.
- Seed script and stabilization/docs (Phases 5–6).

### Acceptance criteria
- `bundle exec rspec` (or `bin/rails spec` if configured) runs the suite successfully with deterministic results.
- Core model rules and API behaviors listed below are covered with clear, maintainable tests.
- Analytics tests correctly validate current-salary scoping, total/average/median (incl. even/odd counts), supported filters, and mixed-currency rejection.

## 2. Test stack & conventions

- **Framework:** **RSpec** (`rspec-rails`) for model and request specs.
- **Test data:** **FactoryBot** (`factory_bot_rails`) for core factories/traits (User, Location, Department, Employee, Salary), with explicit setup where clarity matters.
- **Test types/locations:**
  - Model specs: `spec/models/*_spec.rb`
  - Request specs: `spec/requests/*_spec.rb` covering `/v1` endpoints and auth behavior
  - Support/helpers/factories: `spec/support/**/*.rb`, `spec/factories/**/*.rb`
  - Mailer specs only if trivial for core auth flows (otherwise deferred)
- **Auth in request specs:** helper to authenticate as an `@official.com` user and issue requests with a valid JWT (`Authorization: Bearer <token>`); verify 401 for unauthenticated access to protected endpoints and that `GET /v1/health` remains public.
- **Determinism:** use `travel_to`/ActiveSupport time helpers for date-dependent logic (employee age, “current” salary/analytics as of today). Avoid external dependencies/network calls.
- **Execution:** use Rails transactional test behavior and keep specs isolated/parallel-safe where practical.

## 3. Coverage plan

### 3.1 Authentication & authorization (request)
- **Health:** `GET /v1/health` returns 200 without auth.
- **Sign-in/out:** valid credentials return token/user payload; invalid credentials rejected; sign-out invalidates token/revokes access as implemented.
- **Protected resources:** representative protected endpoints (e.g. users/locations/employees/salaries/analytics) return 401 without/with invalid token.
- **User provisioning basics:** `POST /v1/users` enforces auth and `@official.com`/validation rules as implemented (core cases).

### 3.2 Location (model + request)
- **Model:** presence of required fields, normalization, uniqueness of `(city, state_code, country_code)`, and Carmen validation for valid/invalid country & state codes.
- **Requests:** create/show/update happy paths and 422s for invalid/duplicate data; index pagination/meta and supported filters (`country_code`, `state_code`, `city`) with stable order.

### 3.3 Department (model + request)
- **Model:** presence/association to location, normalization, uniqueness of `(name, location_id)` (same name allowed in different locations).
- **Requests:** create/show/update happy paths and 422s for invalid/duplicate/missing location; index pagination/meta, filters (`location_id`, `name`), resolved location (and head, if applicable) in payload, stable order.

### 3.4 Employee (model + request)
- **Model:** required fields and associations (department/location through), normalization (e.g. email downcase), uniqueness of `employee_code/email/phone`, age ≥ 18 (boundary-aware with frozen time), `last_working_day` nullable and after `date_of_joining`.
- **Requests:** create/show/update happy paths and 422s for invalid/duplicate/underage/date-rule violations; index pagination/meta, supported filters (e.g. `department_id`, `job_title`, `location_id` via relation, `employee_code`/name/email partials as implemented), resolved department/location data, stable order.

### 3.5 Salary (model + request) — critical
- **Model/calculations:** required fields/associations, currency validation (money), amount rules (`base_amount > 0`, others ≥ 0), **`total_amount` derived correctly** (`base + hra + bonus - deduction`), frequency monthly.
- **Period/current rules:**
  - `applicable_till` after `applicable_from`; `applicable_from` on/after employee `date_of_joining`.
  - **No overlapping periods** per employee (including open-ended records) — overlapping attempts rejected.
  - **Auto-close on create:** creating a new salary closes existing open-ended record to `new.applicable_from - 1 day` transactionally; rejects when close would be invalid.
  - Open-ended (`applicable_till` null) represents current record; updates preserve non-overlap/consistency (core cases).
- **Requests:** create/show/update happy paths and 422s for invalid amounts/currency/dates/overlaps; index pagination/meta, filters (e.g. `employee_id`, `department_id`, `currency`, `job_title`) and stable/recent-first order; payload includes resolved employee/department and server-derived total.

### 3.6 Analytics (request) — critical
- **Endpoint/auth:** `GET /v1/analytics` requires auth.
- **Current-salary scoping:** includes only records where `applicable_from <= today` and (`applicable_till` is null or `>= today`); excludes future-start and expired records (deterministic via `travel_to`).
- **Aggregates:** correct `count`, `total`, `average`, `median` of `total_amount` for a known dataset (including **odd and even** counts for median) and consistent numeric formatting/precision.
- **Filters:** each supported filter constrains correctly via relations — `department_id`, `location_id`, `city` (partial), `state_code` (exact, normalized), `job_title` (partial) — and combinations work as expected.
- **Mixed currency:** filtered set spanning multiple currencies returns 422 with clear error; single-currency set succeeds.
- **Empty/no-match:** returns defined empty response (`count: 0`, null/zero aggregates as implemented).

### 3.7 Cross-cutting API behavior
- Consistent resource envelopes and error shapes where applicable (`{resource(s), meta}`, `{error|errors}`), 404 for missing records, and pagination params/meta behavior for list endpoints (spot-checked across resources).

## 4. Implementation steps (suggested)

1. **Test stack setup:** add and configure `rspec-rails` and `factory_bot_rails`; initialize `spec/` (rails_helper/spec_helper), support loading, FactoryBot methods, request/auth helpers, and JSON/time helpers; ensure test DB setup works.
2. **Factories & model specs:** define core factories/traits and implement model specs for critical validations/rules (Location/Department/Employee/Salary), prioritizing salary calculations, period/overlap/auto-close behavior.
3. **Request specs:** add request specs for auth and core CRUD/filter/pagination per resource; implement analytics specs with deterministic data and frozen time (scoping, aggregates/median, filters, mixed-currency, empty cases).
4. **Stabilize:** run full suite, fix failures/flakiness, and keep specs fast and deterministic.

## 5. Decisions (confirmed)

- **Framework:** **RSpec** (`rspec-rails`) instead of building on Minitest — **confirmed**.
- **Test data:** **FactoryBot** (`factory_bot_rails`) for factories/traits, with explicit setup where helpful — **confirmed**.
- **Coverage depth:** prioritize critical correctness (salary rules, analytics, auth, validations, filters/pagination) over exhaustive permutations — **confirmed**.
- **Mailer assertions:** defer mailer/invitation-delivery specs unless trivial — **confirmed**.

---

**References:** `artifacts/plan.md` (Phase 4), `artifacts/requirements.md`, module plans (`artifacts/module1-4`, `artifacts/module5-analytics-plan.md`), and implemented `/v1` API conventions.
