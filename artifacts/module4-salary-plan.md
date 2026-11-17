# Module 4 — Salary (History & Current Compensation) (Module Plan)

This plan details the Salary vertical slice (Phase 3, Module 4) defined in `artifacts/plan.md`, based on `artifacts/requirements.md`. It delivers end-to-end salary record management and history per employee (including current applicable compensation), as a foundation for analytics. Minor implementation details may be refined during development.

## 1. Scope and goals

- Implement **Salary** as a first-class entity to track salary records and history per employee, including the current (open-ended) applicable compensation.
- Provide a complete vertical slice: **migration/schema → model & associations/validations/business rules → `/v1` API (list/show/create/update) → frontend UI (salary history per employee, create/update forms) → integration check**.
- Enforce core correctness: amount/date rules, currency validation, non-overlapping applicable periods per employee, and consistent handling of current vs closed records.

### In scope
- Salary fields (per requirements): `applicable_from`, `applicable_till` (nullable), `job_title`, `currency`, `base_amount`, `hra_amount`, `bonus_amount`, `deduction_amount`, `total_amount`, `frequency` (default monthly), `employee_id`, `department_id`, plus timestamps and id.
- Associations: belongs to `employee` and `department` (salary records the department/title context at that time).
- Validations/business rules: required fields; currency validated via `money` gem; amount constraints (`base_amount > 0`, others ≥ 0, all non-negative; `deduction_amount` ≥ 0); `total_amount = base + hra + bonus − deduction`; `frequency` monthly (for now); date rules (`applicable_till` after `applicable_from`; `applicable_from` on/after employee `date_of_joining`); open-ended current record (`applicable_till` nullable); no overlapping applicable periods per employee; closing previous record when a new one is added.
- Indexing: `applicable_from`, `applicable_till`, `job_title`, `currency`, and FKs (`employee_id`, `department_id`) as appropriate.
- Authenticated HR-only API endpoints under `/v1/salaries` (list/show/create/update) with pagination and filtering, supporting viewing history (notably per employee).
- Frontend: salary history per employee and forms to add/update records, reflecting current vs closed periods and validation/business-rule feedback.
- Core, deterministic tests for calculations, validations, period/overlap rules, and key API behaviors.

### Out of scope
- Deleting salary records.
- Analytics endpoint/aggregates (`GET /v1/salaries/analytics`) — **Module 5**.
- Cross-currency conversion or multi-currency aggregation.
- Frequencies other than monthly.
- Payroll processing, payslip generation, or tax computations.

### Acceptance criteria
- An authenticated HR user can list (paginated, filterable), view, create, and update salary records via the UI and `/v1` API, and view salary history per employee.
- Invalid input/rule violations are rejected with clear errors (422): missing/invalid fields, invalid currency, bad amounts/total, invalid dates, or overlapping periods.
- `total_amount` is consistently correct (computed/validated server-side as base+HRA+bonus−deduction).
- Only the current record may be open-ended (`applicable_till` null); periods do not overlap per employee. When a new salary is added, the previous open/current record is closed appropriately so history remains consistent.
- `applicable_from` is on/after the employee’s `date_of_joining`.
- Unauthenticated requests are rejected (401); `GET /v1/health` remains public.

## 2. Dependencies & prerequisites

- **Modules 1–3 complete:** `locations`, `departments`, `employees` (with associations), auth/shared helpers, frontend shell/routing/API client, `DataTable`/`FilterBar`, async patterns where useful.
- **Backend dependency:** add/configure the **`money`** gem (or `Money::Currency`/equivalent) for currency code validation.
- **Conventions:** versioned `/v1` JSON APIs, `page[number]`/`page[size]` + meta, `filter[...]`, declared-attribute serialization for flat payloads plus resolved display fields, standardized error/message envelopes.

## 3. Backend design

### 3.1 Data model & migration

- **Table:** `salaries`
  - `id` bigint, primary key
  - `applicable_from` date, not null
  - `applicable_till` date, null (open-ended/current)
  - `job_title` string, not null
  - `currency` string, not null (ISO-style currency code, validated)
  - `base_amount` decimal(12,2), not null
  - `hra_amount` decimal(12,2), not null, default 0
  - `bonus_amount` decimal(12,2), not null, default 0
  - `deduction_amount` decimal(12,2), not null, default 0
  - `total_amount` decimal(12,2), not null
  - `frequency` string, not null, default `"month"`
  - `employee_id` bigint, not null (FK to `employees`)
  - `department_id` bigint, not null (FK to `departments`)
  - `created_at`, `updated_at` timestamps (not null)

- **Indexes/constraints:**
  - Indexes on `applicable_from`, `applicable_till`, `job_title`, `currency`
  - Index/FK on `employee_id` and `department_id`
  - Additional index on `(employee_id, applicable_from)` / `(employee_id, applicable_till)` as useful for history/overlap/current lookups (finalized in implementation)
  - Not-null constraints and DB defaults for amount/frequency fields as above

### 3.2 Model & validations/business rules (`Salary`)

- **Associations:** `belongs_to :employee`; `belongs_to :department`. (Department should reflect the department/title context of the salary record; employee’s current department is separate.)
- **Required:** `applicable_from`, `job_title`, `currency`, `employee`, `department`, `base_amount`, `frequency` (and amounts present).
- **Frequency:** only `"month"` supported now (default/enforced).
- **Currency:** must be a valid currency code per `money` (normalized, e.g. uppercase).
- **Amounts:**
  - `base_amount > 0`
  - `hra_amount`, `bonus_amount`, `deduction_amount` ≥ 0
  - `total_amount` computed/derived server-side as `(base_amount + hra_amount + bonus_amount - deduction_amount)` and kept consistent (authoritative on server; client input for total not trusted).
- **Date/period rules:**
  - `applicable_till` (if present) must be after `applicable_from`.
  - `applicable_from` must be on or after `employee.date_of_joining`.
  - **Current record:** the most recent record may have `applicable_till` null (open-ended).
  - **No overlaps per employee:** a salary’s applicable period must not overlap any other salary period for the same employee. Overlap considers open-ended (`applicable_till` null = ongoing) periods.
  - **Adding a new salary closes previous:** when creating a new salary for an employee, the existing open/current record (if any) must be closed before/as part of the change so that periods remain valid and non-overlapping (e.g. set its `applicable_till` to the day before the new `applicable_from`, subject to date validity). This should be handled transactionally and surfaced clearly on validation failure.

- **Updates:** updating a record must revalidate amounts/dates and preserve non-overlap/current-record consistency (including interactions with adjacent/open records). Exact update semantics for historical periods will be implemented carefully to avoid corrupting history.

### 3.3 API contract (`/v1/salaries`, authenticated HR)

| Method | Path | Purpose | Notes |
|---|---|---|---|
| GET | `/v1/salaries` | List salary records | Paginated; filterable (incl. by employee for history) |
| GET | `/v1/salaries/:id` | Show a salary record | 404 if not found; includes resolved display data |
| POST | `/v1/salaries` | Create a salary record | 201 on success; applies close-previous/current rules; 422 on validation/rule failure |
| PATCH | `/v1/salaries/:id` | Update a salary record | 200 on success; revalidates rules/non-overlap; 422 on failure |

- **Pagination:** `page[number]`, `page[size]` with defaults/caps and `meta` via shared helper.
- **Filtering:** at least `filter[employee_id]` (exact, to view history per employee), `filter[department_id]` (exact), `filter[job_title]` (partial, case-insensitive), `filter[currency]` (exact, normalized). (Extensible; analytics-specific filters belong to Module 5.)
- **Sorting:** stable default sort suitable for history (e.g. `applicable_from DESC, id DESC`, or per-employee chronological) — finalized for deterministic pagination and clear “current first” behavior.
- **Request payload:** `{ "salary": { "employee_id", "department_id", "job_title", "currency", "base_amount", "hra_amount", "bonus_amount", "deduction_amount", "applicable_from", "applicable_till", "frequency" } }` (`total_amount` server-derived; `frequency` defaults to month; `applicable_till` optional).
- **Response payload:**
  - List: `{ "salaries": [<salary>, ...], "meta": { "page": { "number", "size" }, "total" } }`
  - Show/create/update: `{ "salary": <salary> }`
  - `<salary>` includes base fields (`id, employee_id, department_id, job_title, currency, base_amount, hra_amount, bonus_amount, deduction_amount, total_amount, frequency, applicable_from, applicable_till, created_at, updated_at`) plus resolved display data (e.g. nested `employee` summary and/or `department` summary) for convenience; shape finalized consistently.

### 3.4 Controller & routing

- Add `resources :salaries, only: [:index, :show, :create, :update]` under `namespace :v1`.
- Implement `V1::SalariesController` using shared helpers, strong params, eager loading for display data, and transactional handling where create/update must coordinate period closure/consistency.

## 4. Frontend design

### 4.1 API module
- `frontend/src/api/salaries.js`: `getSalaries(params)`, `getSalary(id)`, `createSalary(payload)`, `updateSalary(id, payload)`.

### 4.2 Routing & navigation
- Protected routes for salaries (e.g. `/salaries`, `/salaries/new`, `/salaries/:id`, `/salaries/:id/edit`).
- **Salaries** entry in sidebar.
- **Employee context:** make salary history easy to access per employee (e.g. from employee detail/profile and/or pre-filtered salaries view via `filter[employee_id]`), so HR can review/add records in context.

### 4.3 Screens & components
- **Salaries list/history (`/salaries`):** paginated, filterable table (reuse `DataTable`, `FilterBar`) showing key fields (employee, department, job title, currency, amounts/total, period, current/closed state) with view/edit/create actions; supports filtering by employee to show an individual’s history.
- **Salary detail (`/salaries/:id`):** read-only view of salary attributes (components, total, currency, period, frequency) and resolved employee/department info.
- **Salary form (create/edit):** fields for employee (searchable/async picker, scalable to 10k), department, job title, currency, base/HRA/bonus/deduction, applicable_from/applicable_till (nullable), frequency (monthly, defaulted/read-only as applicable). Show computed total (client-side preview) but rely on server as source of truth; display API validation/business-rule errors clearly (including overlap/period-closure issues).
- **Behavior:** reflect current vs closed periods; guide creation of a new current record (closing previous handled per confirmed rule) with clear feedback.

## 5. Testing (core, fast, deterministic)

- **Model tests (`Salary`):** required fields, currency validity, amount constraints and `total_amount` correctness, frequency, date rules (till > from, from >= joining), non-overlapping periods (including open-ended), and previous-record closure behavior on create (as defined).
- **Request/API tests:** auth enforced; create/show/update happy paths and 422s for invalid amounts/currency/dates/overlaps; index pagination/filters (esp. `employee_id`) and stable order; transactional consistency for period closure.
- **Determinism:** fixed dates/amounts/records, no external network dependencies.

## 6. Implementation steps (suggested order)

1. **Dependencies:** add `money` gem and bundle/configure as needed.
2. **Database:** create `salaries` migration (columns, null/default constraints, indexes, FKs) and run migrations.
3. **Model:** implement `Salary` with associations, normalization, amount/total computation, validations, and overlap/current-period/close-previous logic (transactional where required).
4. **API:** add route and `V1::SalariesController` (index/show/create/update) with strong params, eager loading, pagination, filtering, and standardized responses/errors.
5. **Backend tests:** model and request specs for calculations, validations, overlap/closure rules, CRUD, and filtering.
6. **Frontend API & routing:** add `api/salaries.js`, routes, and sidebar entry (plus employee-context entry point to history).
7. **Frontend UI:** implement salaries list/history, detail, and create/edit form (employee/department selection, amount/period inputs, total preview, current/closed display) wired to API with clear error states.
8. **Verification:** manual end-to-end pass (add/update salaries for an employee, history/current behavior, closure on new record, overlap/validation failures).

## 7. Open points to confirm

- **Closing previous record on create:** when adding a new salary, automatically set the existing open-ended (current) record’s `applicable_till` to `applicable_from - 1 day` (transactionally) — OK? (If there is no open record, none closed; if the computed close date is invalid relative to that record’s `applicable_from`, reject with a clear error.) Alternatively require the client to close explicitly — prefer **auto-close** for consistency?
- **Overlap/period rules:** treat periods as date-inclusive ranges `[applicable_from, applicable_till]` with `applicable_till = null` meaning open-ended; any overlap with another record for the same employee is rejected — OK?
- **Update semantics:** allow updating historical/period fields only if non-overlap and current/open-record consistency remain valid (server-enforced). OK to keep edits strict (reject conflicting changes) rather than auto-rewriting adjacent periods?
- **Department on salary:** `department_id` is stored on the salary record (context at that time) and selected in the form (can default to the employee’s current department but remain editable/explicit) — OK?
- **List scope & sorting:** global salaries list supports `filter[employee_id]` for history; default sort `applicable_from DESC, id DESC` (current/recent first) — OK?
- **Frontend selection:** use async-search employee picker (reusing the pattern/component) and a department selector in the salary form — OK?

---

**References:** `artifacts/requirements.md` (Salary model/APIs, business rules, pagination/filtering), `artifacts/plan.md` (Phase 3 Module 4, dependencies), and patterns from Modules 1–3 (`paginate`, `apply_query_filters`/custom filters, serialization helpers, `DataTable`, `FilterBar`, async autocomplete, protected routing).
