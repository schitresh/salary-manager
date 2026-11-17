# Module 3 — Employee (Module Plan)

This plan details the Employee vertical slice (Phase 3, Module 3) defined in `artifacts/plan.md`, based on `artifacts/requirements.md`. It delivers end-to-end employee management (directory, profile, create/edit) linked to departments/locations, and enables department head selection now that employee data exists. Minor implementation details may be refined during development.

## 1. Scope and goals

- Implement **Employee** as a first-class, manageable entity representing employee profiles and employment details.
- Provide a complete vertical slice: **migration/schema → model & associations/validations → `/v1` API (list/show/create/update) → frontend UI (paginated/filterable directory, detail, create/edit) → integration check**.
- Wire the **Department head** relationship end-to-end now that employees exist (nullable FK/association and selectable head in Department flows), handled compatibly with existing data.
- Reuse established patterns (shared pagination/filter/serialization/response helpers, `DataTable`, `FilterBar`, protected routing, resource-keyed payloads).

### In scope
- Employee fields (per requirements): `employee_code`, `first_name`, `last_name`, `email`, `phone`, `date_of_birth`, `date_of_joining`, `last_working_day` (nullable), `job_title`, `department_id`, plus timestamps and id.
- Associations: belongs to `department` (required). Department has many employees; department may have an optional `head_employee` (employee).
- Validations/rules: required fields; unique `employee_code`, `email`, `phone`; `date_of_birth` ensures age ≥ 18; `last_working_day` nullable and, if present, after `date_of_joining`; `job_title` as free text.
- Indexing to support lookup/filtering (e.g. `employee_code`, `email`, `phone`, `job_title`, `date_of_joining`, `department_id`, and FKs as appropriate).
- Authenticated HR-only API endpoints under `/v1/employees` with pagination and filtering/search (department, job title/position, and office/location via relations).
- Frontend: sidebar navigation, paginated/filterable employee directory, profile detail, and create/edit forms with validation/error feedback. No delete flow.
- Department integration: add DB FK `departments.head_employee_id -> employees.id` (nullable), model association, and allow selecting a head employee in Department create/edit/detail/list (resolved display) where practical.
- Core, deterministic tests for model validations/constraints and key API behaviors.

### Out of scope
- Deleting employees (and blocking delete when salaries exist is deferred to Salary module context; no delete flow now).
- Employee self-service/auth accounts or linking `User` to `Employee`.
- Advanced search (full-text) or complex HR workflows beyond profile management.

### Acceptance criteria
- An authenticated HR user can list (paginated, filterable), view, create, and update employees via the UI and `/v1` API.
- Invalid input is rejected with clear validation errors (API 422 and surfaced in forms): missing required fields, duplicate employee code/email/phone, underage DOB, or `last_working_day` not after `date_of_joining`.
- Employees reference a valid department; directory/detail shows resolved department/location context for display.
- `last_working_day` can be null for currently working employees; records are preserved (no delete).
- Department head can be set/updated to an existing employee (nullable) with referential integrity; Department UI exposes head selection now that employees exist.
- Unauthenticated requests are rejected (401); `GET /v1/health` remains public.

## 2. Dependencies & prerequisites

- **Modules 1–2 complete:** `locations`, `departments` (with nullable `head_employee_id` column/index), auth/shared helpers, frontend shell/routing/API client, `DataTable`/`FilterBar`.
- **Cross-module update:** migration to add FK `departments.head_employee_id -> employees` after `employees` table exists; update Department model/controller/serialization/UI to resolve/select head.
- **Conventions:** versioned `/v1` JSON APIs, `page[number]`/`page[size]` + meta, `filter[...]`, declared-attribute serialization for flat payloads plus explicit nested/derived fields, standardized error/message envelopes.

## 3. Backend design

### 3.1 Data model & migrations

- **Table:** `employees`
  - `id` bigint, primary key
  - `employee_code` string, not null, unique
  - `first_name` string, not null
  - `last_name` string, not null
  - `email` string, not null, unique
  - `phone` string, not null, unique
  - `date_of_birth` date, not null
  - `date_of_joining` date, not null
  - `last_working_day` date, null
  - `job_title` string, not null
  - `department_id` bigint, not null (foreign key to `departments`)
  - `created_at`, `updated_at` timestamps (not null)

- **Indexes/constraints:**
  - Unique indexes on `employee_code`, `email`, `phone`
  - Index on `department_id` (FK, indexed by default) and FK to `departments`
  - Indexes on `job_title`, `date_of_joining` (per requirements/lookup needs)
  - Not-null constraints for required fields

- **Department head FK migration (integration):** add foreign key `departments.head_employee_id` -> `employees.id` (nullable, `on_delete: :nullify` or restrict as appropriate — finalized in implementation; nullify is safe to avoid blocking future operations).

### 3.2 Model & validations (`Employee`)

- **Associations:** `belongs_to :department`; `has_one :location, through: :department` (for convenience/filtering/display). Department gains `belongs_to :head_employee, class_name: "Employee", optional: true` and `has_many :employees`.
- **Required:** `employee_code`, `first_name`, `last_name`, `email`, `phone`, `date_of_birth`, `date_of_joining`, `job_title`, `department`.
- **Normalization:** strip whitespace; normalize `email` (downcase) and optionally `employee_code`/`phone` consistently before validation/save.
- **Uniqueness:** `employee_code`, `email`, `phone` unique (case-insensitive where appropriate, e.g. email/code).
- **Date rules:**
  - `date_of_birth` must indicate age ≥ 18 (computed relative to current date at validation time; boundary handled explicitly).
  - `last_working_day`, if present, must be after `date_of_joining`.
- **Job title:** free text (no catalog validation now).

### 3.3 API contract (`/v1/employees`, authenticated HR)

| Method | Path | Purpose | Notes |
|---|---|---|---|
| GET | `/v1/employees` | List employees | Paginated; filterable/searchable; includes resolved display data |
| GET | `/v1/employees/:id` | Show an employee | 404 if not found; includes resolved display data |
| POST | `/v1/employees` | Create an employee | 201 on success, 422 on validation failure |
| PATCH | `/v1/employees/:id` | Update an employee | 200 on success, 422 on validation failure |

- **Pagination:** `page[number]`, `page[size]` with defaults/caps and `meta` via shared helper.
- **Filtering:** support at least `filter[department_id]` (exact), `filter[job_title]` (partial, case-insensitive), and office/location via relations — e.g. `filter[location_id]` (exact, through department). Optionally `filter[employee_code]` (partial) for lookup. Join-based filters applied explicitly where needed (beyond simple same-table filters).
- **Sorting:** stable default sort (e.g. `last_name ASC, first_name ASC, id ASC`) for deterministic pagination.
- **Request payload:** `{ "employee": { "employee_code", "first_name", "last_name", "email", "phone", "date_of_birth", "date_of_joining", "last_working_day", "job_title", "department_id" } }`.
- **Response payload:**
  - List: `{ "employees": [<employee>, ...], "meta": { "page": { "number", "size" }, "total" } }`
  - Show/create/update: `{ "employee": <employee> }`
  - `<employee>` includes base persisted fields plus **resolved display data** for convenience, e.g. nested `department` `{ id, name, location_id, location: { id, city, state_code, country_code } }` (shape finalized in implementation, consistent with conventions).

### 3.4 Department API/UI updates (integration)

- **Model/controller:** load/permit/validate optional `head_employee_id`; include resolved `head_employee` summary in department payloads (e.g. `{ id, employee_code, first_name, last_name }`) when present.
- **Frontend:** department form allows selecting head from employees (e.g. dropdown populated from `/v1/employees`) or clearing it; department list/detail display head info when available.

## 4. Frontend design

### 4.1 API module
- `frontend/src/api/employees.js`: `getEmployees(params)`, `getEmployee(id)`, `createEmployee(payload)`, `updateEmployee(id, payload)`.

### 4.2 Routing & navigation
- Protected routes: `/employees`, `/employees/new`, `/employees/:id`, `/employees/:id/edit` within authenticated layout.
- **Employees** entry in sidebar navigation.

### 4.3 Screens & components
- **Employees list (`/employees`):** paginated, filterable directory (reuse `DataTable`, `FilterBar`) showing key fields (code, name, email/phone, job title, department/location) with view/edit/create actions; loading/empty/error states and pagination.
- **Employee detail (`/employees/:id`):** read-only profile including employment details and resolved department/location; navigation to edit/back.
- **Employee form (create/edit):** fields for all employee attributes; department selected from existing departments (dropdown via `/v1/departments`); date inputs for DOB/joining/last working day (nullable); displays API validation errors clearly.
- **Department form (update):** add head employee selection (from employees) with ability to clear.

## 5. Testing (core, fast, deterministic)

- **Model tests (`Employee`):** presence/required fields, uniqueness (code/email/phone), age ≥ 18, last working day after joining (and nullable), department association.
- **Request/API tests:** auth enforced; create/show/update happy paths and 422s for invalid data; index pagination, supported filters (department/job_title/location via relation) and stable order; resolved related data present.
- **Department integration tests:** head_employee can be assigned/cleared and FK/nullify behavior as defined.
- **Determinism:** fixed dates/records, no external dependencies.

## 6. Implementation steps (suggested order)

1. **Database:** create `employees` migration (columns, constraints, indexes, FK to `departments`); add migration for `departments.head_employee_id` FK to `employees` (nullable, nullify on delete as decided); run migrations.
2. **Models:** implement `Employee` (associations, normalization, validations) and update `Department` (head_employee association, has_many employees).
3. **API:** add routes and `V1::EmployeesController` (index/show/create/update) with strong params, eager loading, pagination, filters (including join-based location filter), and serialized responses with resolved data; update `V1::DepartmentsController`/payloads to include/permit head employee.
4. **Backend tests:** model and request specs for employee CRUD/validations/filters and department head integration.
5. **Frontend API & routing:** add `api/employees.js`, routes, sidebar entry.
6. **Frontend UI:** implement employee list/detail/form; update department list/detail/form to show/select head employee.
7. **Verification:** manual end-to-end pass (employee CRUD, filters, validation failures, department head assignment/clearing).

## 7. Open points to confirm

- **Filters:** support `filter[department_id]` (exact), `filter[job_title]` (partial, case-insensitive), `filter[location_id]` (exact, via department) and `filter[employee_code]` (partial) — sufficient for “department, position/job title, office/location” lookup? Any others needed now (e.g. name/email search)?
- **Default sort:** `last_name ASC, first_name ASC, id ASC` for stable directory pagination — OK?
- **Head employee FK behavior:** when adding FK `departments.head_employee_id -> employees`, use `ON DELETE SET NULL` (so an employee record edge-case doesn’t block) vs restrict — prefer **SET NULL**?
- **Department UI head selection:** add a head-employee dropdown (populated from employees, with clear option) on department create/edit and show head on detail/list now — OK?
- **Response shape:** include nested `department` (with nested `location`) on employee payloads for display, and include nested `head_employee` summary on department payloads — OK?
- **Email normalization:** store/compare emails lowercased (consistent with Users) — OK?

---

**References:** `artifacts/requirements.md` (Employee/Department models & APIs, pagination/filtering), `artifacts/plan.md` (Phase 3 Module 3, dependencies), and patterns from Modules 1–2/auth slices.
