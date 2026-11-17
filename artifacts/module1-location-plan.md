# Module 1 — Location (Module Plan)

This plan details the Location vertical slice (Phase 3, Module 1) defined in `artifacts/plan.md`, based on `artifacts/requirements.md`. It delivers end-to-end location management as a foundation for departments and location-based filtering/analytics. Minor implementation details may be refined during development.

## 1. Scope and goals

- Implement **Location** as a first-class, manageable entity representing office locations (city, state, country).
- Provide a complete vertical slice: **migration/schema → model & validations → `/v1` API (list/show/create/update) → frontend UI (list/detail/create/edit) → integration check**.
- Establish reusable patterns for subsequent modules (resource API module, list/detail/form UI, and use of `DataTable` / shared response conventions).

### In scope
- Location fields: `city`, `state_code`, `country_code` (plus timestamps and id). `state_code` stores the normalized carmen subregion code (consistent with `country_code`); requirements/spec wording will be aligned accordingly.
- Validations: required fields, unique `(city, state_code, country_code)` combination, and `state_code`/`country_code` validation via the `carmen` gem (city remains open text).
- Indexing to support lookup/filtering (`state_code`, `country_code`, and the uniqueness constraint).
- Authenticated HR-only API endpoints under `/v1/locations` with pagination and basic filtering.
- Frontend: sidebar navigation entry, paginated list view, detail view, and create/edit forms with validation/error feedback.
- Core, deterministic tests for model validations/constraints and key API behaviors.

### Out of scope
- Deleting locations (deferred per requirements).
- Advanced location hierarchies or geocoding.
- Location selection UX in dependent modules beyond basic readiness (Department integration is handled in Module 2).

### Acceptance criteria
- An authenticated HR user can list (paginated), view, create, and update locations via the UI and `/v1` API.
- Invalid input (missing/invalid/duplicate city-state-country) is rejected with clear validation errors (API 422 and surfaced in forms).
- State/region and country codes are validated using `carmen`.
- Unauthenticated requests to `/v1/locations` are rejected (401); `GET /v1/health` remains public.
- The feature is navigable from the authenticated app shell.

## 2. Dependencies & prerequisites

- **Phase 1 & 2 complete:** running backend/frontend, MySQL configured, JWT auth and protected resource access in place, shared API client (`apiRequest`, 401 handling) and `DataTable` available.
- **Backend dependency:** add/configure the **`carmen`** gem for country/state validation (and load required data if needed).
- **Conventions:** versioned `/v1` JSON APIs, pagination via `page[number]`/`page[size]` with meta, filtering via `filter[...]`, and standardized error/message helpers (`render_error`/`render_errors`/`render_message`, `paginate`) introduced in the auth slice.

## 3. Backend design

### 3.1 Data model & migration

- **Table:** `locations`
  - `id` bigint, primary key
  - `city` string, not null
  - `state_code` string, not null (normalized carmen subregion code for the given country)
  - `country_code` string, not null (uppercase ISO 3166-1 alpha-2 country code, validated via `carmen`)
  - `created_at`, `updated_at` timestamps (not null)

- **Indexes/constraints:**
  - Index on `state_code`
  - Index on `country_code`
  - Unique index on `(city, state_code, country_code)` to enforce the unique-combination rule
  - Not-null constraints at the database level for required fields (in addition to model validations)

> Note: foreign keys (when referenced by other tables) are indexed by default per project conventions; no dependent FKs exist yet.

### 3.2 Model & validations (`Location`)

- **Required:** `city`, `state_code`, `country_code` present.
- **Normalization:** trim whitespace and normalize `country_code` and `state_code` (e.g. uppercase) before validation/save so comparisons and uniqueness are consistent.
- **Uniqueness:** `(city, state_code, country_code)` unique (case/whitespace normalization strategy applied consistently; validation aligned with the DB unique index).
- **Carmen validation:**
  - `country_code` must correspond to a valid country in `carmen`.
  - `state_code` must be a valid subregion code for the given country in `carmen`.
- **City:** open text (no fixed catalog validation at this stage).

### 3.3 API contract (`/v1/locations`, authenticated HR)

All endpoints require a valid HR JWT (except public health) and return JSON. Errors use the standardized envelope (`{ "error": "..." }` or `{ "errors": [...] }`); validation failures return 422.

| Method | Path | Purpose | Notes |
|---|---|---|---|
| GET | `/v1/locations` | List locations | Paginated; supports filtering |
| GET | `/v1/locations/:id` | Show a location | 404 if not found |
| POST | `/v1/locations` | Create a location | 201 on success, 422 on validation failure |
| PATCH | `/v1/locations/:id` | Update a location | 200 on success, 422 on validation failure |

- **Pagination:** `page[number]`, `page[size]` with defaults/caps and `meta` (`{ page: { number, size }, total }`) via the shared helper.
- **Filtering:** `filter[...]` params — `filter[country_code]` and `filter[state_code]` (exact match on normalized values) and `filter[city]` (partial, case-insensitive match) — to support lookup and future dependent selection.
- **Sorting:** stable default sort `country_code ASC, state_code ASC, city ASC, id ASC` for deterministic, predictable pagination.
- **Request payload (create/update):** `{ "location": { "city", "state_code", "country_code" } }`.
- **Response payload (kept consistent with existing API conventions):**
  - List: `{ "locations": [<location>, ...], "meta": { "page": { "number", "size" }, "total" } }`
  - Show/create/update: `{ "location": <location> }`
  - `<location>` includes `id`, `city`, `state_code`, `country_code`, `created_at`, `updated_at` (base persisted fields; derived display labels may be added later if needed). Errors/messages follow the shared envelopes.

### 3.4 Controller & routing

- Add `resources :locations, only: [:index, :show, :create, :update]` under `namespace :v1` (protected by default auth).
- Implement `V1::LocationsController` using shared pagination/response helpers and strong params.

## 4. Frontend design

### 4.1 API module

- `frontend/src/api/locations.js` (using `apiRequest`):
  - `getLocations(params)` — list with pagination/filter query params.
  - `getLocation(id)` — fetch single location.
  - `createLocation(payload)` — create.
  - `updateLocation(id, payload)` — update.

### 4.2 Routing & navigation

- Add protected route(s) for locations (e.g. `/locations`, `/locations/new`, `/locations/:id`, `/locations/:id/edit`) within the authenticated layout.
- Add a **Locations** entry to the sidebar navigation.

### 4.3 Screens & components (modular, MUI)

- **Locations list (`/locations`):** paginated table (reuse `DataTable`) showing key fields (city, state, country_code) with actions to view/edit and a control to create a new location; loading/empty/error states and pagination meta.
- **Location detail (`/locations/:id`):** read-only view of location attributes with navigation to edit/back to list.
- **Location form (create `/locations/new`, edit `/locations/:id/edit`):** fields for city, state_code, country_code; submit/cancel actions; displays API validation errors (including uniqueness/carmen errors) inline/clearly. (Plain inputs with server-side validation for now.)
- **Behavior:** client-side required-field checks as appropriate, with authoritative validation on the server; successful create/update navigates to detail or list with feedback.

> Component decomposition (list/detail/form, shared form component for create/edit) is finalized during implementation to maximize reuse (including future selection in Department forms).

## 5. Testing (core, fast, deterministic)

- **Model tests (`Location`):** presence validations, uniqueness of `(city, state, country_code)`, and `carmen`-based country/state validity (including invalid combinations).
- **Request/API tests:** 
  - Auth enforced (401 without token) and `GET /v1/health` remains public.
  - Create/show/update happy paths and 422 responses for invalid/duplicate data.
  - Index returns paginated results with `meta`, respects pagination params and supported `filter[...]` params, and uses a stable order.
- **Determinism:** no external network calls; use fixed/known-valid country/state codes from `carmen` data available in the test environment.

## 6. Implementation steps (suggested order)

1. **Dependencies:** add `carmen` gem and bundle/install/configure as needed.
2. **Database:** create `locations` migration (columns, null constraints, indexes, unique index) and run migrations.
3. **Model:** implement `Location` with validations (presence, uniqueness, carmen country/state) and any normalization.
4. **API:** add route, `V1::LocationsController` (index/show/create/update) with strong params, pagination, filtering, and standardized responses/errors.
5. **Backend tests:** model and request specs for validations, CRUD, pagination/filtering, and auth protection.
6. **Frontend API & routing:** add `api/locations.js`, routes, and sidebar entry.
7. **Frontend UI:** implement list, detail, and create/edit form views wired to the API with loading/error/validation states.
8. **Verification:** manual end-to-end pass (create, list/paginate/filter, view, edit, validation failures) as an authenticated HR user.

## 7. Confirmed decisions

- **Field naming/representation:** use `state_code` (normalized carmen subregion code) and `country_code` (uppercase ISO 3166-1 alpha-2), with normalization before validation/save. `requirements.md` to be aligned with `state_code` for consistency.
- **Filtering & sort:** `filter[country_code]`, `filter[state_code]` (exact, normalized), `filter[city]` (partial, case-insensitive); default sort `country_code, state_code, city, id`.
- **Response format:** keep current project convention consistently — list `{ "locations": [...], "meta": { "page": { "number", "size" }, "total" } }`, single `{ "location": { id, city, state_code, country_code, created_at, updated_at } }`, shared error/message envelopes.
- **UI inputs:** plain inputs with authoritative server-side validation for now (no country/state selection aids yet).

---

**References:** `artifacts/requirements.md` (Location model/APIs, pagination/filtering, UI conventions), `artifacts/plan.md` (Phase 3 Module 1, per-module planning approach), and established patterns from the auth/users slice (`paginate`, response helpers, `DataTable`, protected routing).
