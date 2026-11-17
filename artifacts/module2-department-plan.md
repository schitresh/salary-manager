# Module 2 — Department (Module Plan)

This plan details the Department vertical slice (Phase 3, Module 2) defined in `artifacts/plan.md`, based on `artifacts/requirements.md`. It delivers end-to-end department management, linked to locations, as a foundation for employees and salary/analytics. Minor implementation details may be refined during development.

## 1. Scope and goals

- Implement **Department** as a first-class, manageable entity representing organizational departments at a specific location, with an optional head (employee).
- Provide a complete vertical slice: **migration/schema → model & associations/validations → `/v1` API (list/show/create/update) → frontend UI (list/detail/create/edit) → integration check**.
- Reuse established patterns (shared pagination/filter/serialization/response helpers, `DataTable`, `FilterBar`, protected routing, resource-keyed payloads).

### In scope
- Department fields: `name`, `location_id` (required), `head_employee_id` (optional/nullable), plus timestamps and id.
- Associations: belongs to `location` (required). Optional head relationship to Employee is accommodated now as a nullable reference and fully wired when the Employee module is implemented (see §3.1/§3.2).
- Validations: required `name` and `location_id`; `name` unique within the same `location_id` (unique combination of name & location).
- Indexing: `name` (as specified) and foreign-key/index support for lookups as appropriate.
- Authenticated HR-only API endpoints under `/v1/departments` with pagination and basic filtering, returning department data with resolved related location info for display.
- Frontend: sidebar navigation entry, paginated/filterable list view, detail view, and create/edit forms with validation/error feedback and location selection.
- Core, deterministic tests for model validations/constraints and key API behaviors.

### Out of scope
- Deleting departments (deferred per requirements).
- Employee-head selection/picker UX until Employee data exists (Module 3); the field remains nullable and manageable via API.
- Advanced department hierarchies or reporting structures.

### Acceptance criteria
- An authenticated HR user can list (paginated, filterable), view, create, and update departments via the UI and `/v1` API.
- Departments must reference a valid location; invalid input (missing name/location, non-existent location, duplicate name+location) is rejected with clear validation errors (API 422 and surfaced in forms).
- `head_employee_id` is optional and does not block department creation/update in this module.
- Unauthenticated requests to `/v1/departments` are rejected (401); `GET /v1/health` remains public.
- The feature is navigable from the authenticated app shell.

## 2. Dependencies & prerequisites

- **Phase 1 & 2 and Module 1 complete:** auth/protected access, shared controller helpers (pagination, serialization, filters, responses), frontend shell/routing/API client, `DataTable`/`FilterBar`, and `locations` available for association/selection.
- **Employee dependency (partial):** `head_employee_id` references an employee (future). Because the `employees` table does not exist yet, the schema will store a nullable `head_employee_id` now and defer a database-level foreign key to the `employees` table until Module 3 (application-level/shape compatibility handled accordingly). Employee-head selection in the UI is deferred until Employee data exists.
- **Conventions:** versioned `/v1` JSON APIs, `page[number]`/`page[size]` + meta, `filter[...]`, declared-attribute serialization for flat payloads, and standardized error/message envelopes.

## 3. Backend design

### 3.1 Data model & migration

- **Table:** `departments`
  - `id` bigint, primary key
  - `name` string, not null
  - `location_id` bigint, not null (foreign key to `locations`)
  - `head_employee_id` bigint, null (nullable; employee reference, FK to `employees` added in Module 3 when available)
  - `created_at`, `updated_at` timestamps (not null)

- **Indexes/constraints:**
  - Index on `name` (per requirements)
  - Index/foreign key on `location_id` (references `locations`, indexed by default)
  - Index on `head_employee_id` (supports future lookup; nullable)
  - Unique index on `(name, location_id)` to enforce unique department name per location
  - Not-null constraints for required fields at the database level

> Note: database-level FK for `head_employee_id -> employees` is intentionally deferred until `employees` exists (Module 3) to avoid a broken migration dependency; referential integrity for head can be enforced at the application layer once employees are present.

### 3.2 Model & validations (`Department`)

- **Associations:**
  - `belongs_to :location` (required)
  - `belongs_to :head_employee, class_name: "Employee", optional: true` — defined compatibly; association usage that loads `Employee` becomes effective in/after Module 3 (head remains a nullable id in this slice).
- **Required:** `name`, `location_id` present (and location must exist).
- **Normalization:** strip surrounding whitespace from `name` before validation/save for consistent uniqueness checks (case-sensitivity behavior aligned with DB/index strategy, finalized in implementation).
- **Uniqueness:** `name` scoped to `location_id` (a department name is unique within a location, but may repeat across different locations).
- **Head:** optional/nullable; no strict existence validation against employees in this module (employees not yet implemented). Can be revisited in Module 3.

### 3.3 API contract (`/v1/departments`, authenticated HR)

All endpoints require a valid HR JWT and return JSON. Errors use the standardized envelopes; validation failures return 422.

| Method | Path | Purpose | Notes |
|---|---|---|---|
| GET | `/v1/departments` | List departments | Paginated; supports filtering; includes resolved location data |
| GET | `/v1/departments/:id` | Show a department | 404 if not found; includes resolved location data |
| POST | `/v1/departments` | Create a department | 201 on success, 422 on validation failure |
| PATCH | `/v1/departments/:id` | Update a department | 200 on success, 422 on validation failure |

- **Pagination:** `page[number]`, `page[size]` with defaults/caps and `meta` (`{ page: { number, size }, total }`) via the shared helper.
- **Filtering:** `filter[...]` params — `filter[location_id]` (exact) and `filter[name]` (partial, case-insensitive) for lookup/selection and consistency with list views. (Extensible via the shared filter helper.)
- **Sorting:** stable default sort (e.g. `name ASC, id ASC`, or `name ASC, location_id ASC, id ASC`) for deterministic pagination — finalized in implementation.
- **Request payload (create/update):** `{ "department": { "name", "location_id", "head_employee_id" } }` (`head_employee_id` optional/nullable).
- **Response payload (consistent with project conventions):**
  - List: `{ "departments": [<department>, ...], "meta": { "page": { "number", "size" }, "total" } }`
  - Show/create/update: `{ "department": <department> }`
  - `<department>` includes base fields `id`, `name`, `location_id`, `head_employee_id`, `created_at`, `updated_at`, plus **resolved location display data** for convenience (e.g. a nested `location` object `{ id, city, state_code, country_code }` or equivalent flat display fields) so the UI can render without extra lookups. Exact shape kept consistent and finalized in implementation (base attributes via declared list + explicit/computed association fields as needed).

### 3.4 Controller & routing

- Add `resources :departments, only: [:index, :show, :create, :update]` under `namespace :v1`.
- Implement `V1::DepartmentsController` using shared pagination/response/serialization/filter helpers and strong params. Eager-load/preload `location` for index/show to provide resolved display data efficiently.

## 4. Frontend design

### 4.1 API module

- `frontend/src/api/departments.js` (using `apiRequest`):
  - `getDepartments(params)` — list with pagination/filter query params.
  - `getDepartment(id)` — fetch single department.
  - `createDepartment(payload)` — create.
  - `updateDepartment(id, payload)` — update.

### 4.2 Routing & navigation

- Add protected routes (e.g. `/departments`, `/departments/new`, `/departments/:id`, `/departments/:id/edit`) within the authenticated layout.
- Add a **Departments** entry to the sidebar navigation.

### 4.3 Screens & components (modular, MUI)

- **Departments list (`/departments`):** paginated table (reuse `DataTable`) with a reusable filter bar (`FilterBar`) — e.g. filter by name (and/or location) and location_id — showing department name and location (resolved), with actions to view/edit and create; loading/empty/error states and pagination controls.
- **Department detail (`/departments/:id`):** read-only view of department attributes including resolved location info and head (id, or details when available later) with navigation to edit/back to list.
- **Department form (create/edit):** fields for name and location (selected from existing locations, e.g. via a select populated from `/v1/locations`) and an optional head employee reference (kept simple/nullable for now; richer selection added with Module 3). Submit/cancel actions; displays API validation errors clearly.
- **Behavior:** client-side required-field checks as appropriate, authoritative server-side validation; successful create/update navigates to detail or list with feedback.

> Location selection in the form should be user-friendly (choose from available locations) rather than requiring raw ids where practical, reusing the Locations API.

## 5. Testing (core, fast, deterministic)

- **Model tests (`Department`):** presence of name/location, uniqueness of `(name, location_id)` (same name allowed for different locations), association to location, and normalization behavior as applicable.
- **Request/API tests:**
  - Auth enforced (401 without token).
  - Create/show/update happy paths and 422 responses for invalid/duplicate data or missing location.
  - Index returns paginated results with `meta`, respects pagination and supported `filter[...]` params, includes resolved location data, and uses a stable order.
- **Determinism:** rely on created fixture/record data (locations) with no external dependencies.

## 6. Implementation steps (suggested order)

1. **Database:** create `departments` migration (columns, null constraints, indexes, unique index, FK to `locations`); run migrations.
2. **Model:** implement `Department` with associations, normalization, and validations (presence, uniqueness scoped to location).
3. **API:** add route and `V1::DepartmentsController` (index/show/create/update) with strong params, eager-loaded location, pagination, filtering, and standardized/serialized responses.
4. **Backend tests:** model and request specs for validations, CRUD, pagination/filtering, resolved location data, and auth protection.
5. **Frontend API & routing:** add `api/departments.js`, routes, and sidebar entry.
6. **Frontend UI:** implement list (with `FilterBar`/`DataTable`), detail, and create/edit form (with location selection) wired to the API with loading/error/validation states.
7. **Verification:** manual end-to-end pass (create, list/paginate/filter, view, edit, validation failures) as an authenticated HR user.

## 7. Open points to confirm

- **`head_employee_id` handling now:** store as nullable column/index without a DB FK to `employees` until Module 3 (then add FK/association wiring), keeping head optional. Is this acceptable?
- **Response shape for related location:** include a nested `location` object (e.g. `{ id, city, state_code, country_code }`) on each department for display, in addition to `location_id`? (Proposed for convenience/consistency.)
- **List filters & sort:** support `filter[location_id]` (exact) and `filter[name]` (partial, case-insensitive); default sort `name ASC, id ASC` (or include `location_id`) — confirm preference.
- **Form UX:** location selected via dropdown populated from `/v1/locations` (paginated fetch/load as needed) and `head_employee_id` left unset/simple for now (no employee picker until Module 3). Confirm this matches expectations.

---

**References:** `artifacts/requirements.md` (Department model/APIs), `artifacts/plan.md` (Phase 3 Module 2, dependencies/notes), and patterns from Module 1/auth slices (`paginate`, `apply_query_filters`, serialization helpers, `DataTable`, `FilterBar`, protected routing).
