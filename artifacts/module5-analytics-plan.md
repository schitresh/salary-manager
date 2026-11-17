# Module 5 — Analytics (Module Plan)

This plan details the Analytics vertical slice (Phase 3, Module 5) defined in `artifacts/plan.md`, based on `artifacts/requirements.md`. It delivers pay analytics over **current applicable salaries** with per-currency aggregates and relation-based filtering. Minor implementation details may be refined during development.

## 1. Scope and goals

- Provide HR-facing analytics that answer pay questions via aggregate metrics over **current applicable salaries** only.
- Expose a backend endpoint `GET /v1/analytics` returning **total, average, and median** of `total_amount` for the filtered, current-salary result set.
- Support filtering by department, location, city, state code, and job title (resolved via relations) and enforce **single-currency** correctness by raising a clear error on mixed-currency results.
- Deliver a frontend analytics view with filter controls and clear display of results and error states (including mixed-currency).

### In scope
- **Current-salary scoping:** include only salaries where today is on/after `applicable_from` and (`applicable_till` is null OR today is on/before `applicable_till`).
- **Aggregates:** `total`, `average`, and `median` of `total_amount` over the scoped/filtered records (per-currency).
- **Filters (via `filter[...]`):** `department_id`, `location_id`, `city`, `state_code`, `job_title` (resolved through `salary -> department -> location` and salary fields as appropriate).
- **Currency correctness:** if the filtered current-salary set spans more than one currency, return a clear error prompting the user to filter to a single currency (no cross-currency aggregation).
- **Frontend:** analytics screen with filter inputs/controls, submit/apply action, and presentation of aggregates (with currency/context) plus error/empty states.
- Core, deterministic tests for scoping, aggregates (incl. median), filters, and mixed-currency handling.

### Out of scope
- Cross-currency conversion or multi-currency aggregation.
- Historical/trend analytics, breakdowns/group-bys, charts, export, or pagination of analytics results.
- Analytics over non-current salaries (except as inherently excluded by scoping).
- New salary CRUD behavior (Module 4 complete).

### Acceptance criteria
- `GET /v1/analytics` (authenticated HR) returns correct `total`, `average`, `median` for **current applicable salaries** matching supplied filters.
- Non-current salaries are excluded (future `applicable_from`, or `applicable_till` before today).
- Filters `department_id`, `location_id`, `city`, `state_code`, `job_title` correctly constrain results via relations.
- Mixed-currency filtered results produce a clear error response (no aggregates returned); single-currency results succeed with the currency indicated.
- Frontend analytics view allows applying filters, displays aggregates, and surfaces mixed-currency/validation/empty states clearly.
- Unauthenticated requests are rejected (401); `GET /v1/health` remains public.

## 2. Dependencies & prerequisites

- **Modules 1–4 complete:** `locations`, `departments`, `employees`, `salaries` with associations/validations and current-period rules; shared auth/controller helpers; frontend shell/routing/API client, `DataTable`/`FilterBar`, async picker patterns.
- **Data relations for filters:** `Salary belongs_to :department` and `Department belongs_to :location` (salary `job_title` stored on salary). Joins used to filter by `location_id`, `city`, `state_code`.
- **Conventions:** versioned `/v1` JSON APIs, `filter[...]` params, standardized error/message envelopes.

## 3. Backend design

### 3.1 Endpoint & contract

- **Route:** `GET /v1/analytics` (authenticated HR), implemented in a dedicated analytics controller (`V1::AnalyticsController`).
- **Query params:** `filter[department_id]`, `filter[location_id]`, `filter[city]`, `filter[state_code]`, `filter[job_title]` (all optional; combinable).
  - `department_id`, `location_id`: exact match (resolved via relations).
  - `city`: partial, case-insensitive match on location city.
  - `state_code`: exact match (normalized/uppercase) on location state code.
  - `job_title`: partial, case-insensitive match on salary `job_title`.
- **Scoping:** `applicable_from <= today` AND (`applicable_till IS NULL OR applicable_till >= today`), where `today` is the server’s current date.

### 3.2 Computation & correctness

- **Base scope:** current salaries joined to departments/locations as needed for filters; apply provided filters.
- **Currency check:** determine distinct currencies in the filtered scope.
  - If more than one distinct currency: return a clear error (e.g. 422) such as “Multiple currencies found in the filtered salaries. Please filter to a single currency.” with no aggregate values.
  - If zero records: return a well-defined empty result (e.g. totals/averages/median as `0`/`null` with `count: 0`, or an explicit empty state) — finalized in implementation (prefer explicit `count` and nullable aggregates for clarity).
  - If exactly one currency: compute and return aggregates in that currency.
- **Aggregates (over `total_amount`):**
  - `total`: sum
  - `average`: arithmetic mean (rounded/precision consistent with decimal(12,2) amounts)
  - `median`: middle value (or average of two middle values for even counts) over sorted `total_amount` values of the scoped set.
- **Median implementation:** compute deterministically in SQL (e.g. ordered values with offsets/window function as supported by MySQL 8) or via a bounded in-memory calculation over the scoped result set; choose an approach that is correct, readable, and performant enough for expected volumes (~10k employees). Exact method finalized in implementation.

### 3.3 Response & errors

- **Success (example shape, finalized in implementation):**
  ```json
  {
    "analytics": {
      "currency": "INR",
      "count": 120,
      "total": "1234567.89",
      "average": "10288.07",
      "median": "9800.00"
    },
    "filters": { "department_id": 1, "job_title": "Engineer" }
  }
  ```
  (Numeric formatting/precision and whether to echo applied filters are finalized in implementation; response follows project JSON conventions.)
- **Mixed currency:** standardized error response (422) with a clear message prompting filtering to a single currency.
- **Invalid/empty filter edge cases:** handled gracefully (empty result vs aggregates as defined above).

### 3.4 Controller & routing

- Add `get :analytics, on: :collection` (or equivalent) for `salaries` under `namespace :v1`.
- Implement analytics action in `V1::SalariesController` (or a dedicated concern/service extracted for clarity) reusing filter-building patterns where practical; keep action focused and testable.

## 4. Frontend design

### 4.1 API module
- Extend `frontend/src/api/salaries.js` with `getSalaryAnalytics({ filters })` calling `GET /analytics` with `filter[...]` params.

### 4.2 Routing & navigation
- Add an **Analytics** view/screen (e.g. route `/analytics`) accessible from the authenticated layout and sidebar, as a first-class HR feature (separate from CRUD list pages).

### 4.3 Screen & behavior
- **Filter controls:** inputs/selects for `department_id` (department picker), `location_id` (location picker), `city`, `state_code`, and `job_title` (text/partial as appropriate), with Apply/Clear. Reuse existing components/patterns (e.g. `FilterBar`/selects, async patterns if needed) — department/location lists are manageable; simple dropdowns populated from APIs are sufficient.
- **Results display:** on success, show `currency`, `count`, `total`, `average`, `median` clearly (cards/typography/table) with the applied context.
- **States:** initial/idle, loading, success, empty (no matching current salaries), and error — including a specific, user-friendly display for mixed-currency errors prompting the user to narrow filters.
- **No cross-currency conversion:** UI messaging consistent with backend behavior.

## 5. Testing (core, fast, deterministic)

- **Request/API tests (`/v1/analytics`):**
  - Auth enforced (401 without token).
  - Correct scoping: includes only current salaries (open-ended or covering today), excludes future and expired records.
  - Correct aggregates: `total`, `average`, `median` (including even/odd counts) for a known fixture dataset.
  - Filters: each supported filter (`department_id`, `location_id`, `city`, `state_code`, `job_title`) and combinations constrain results correctly via relations.
  - Mixed-currency: returns clear error when filtered set contains multiple currencies; succeeds when narrowed to one currency.
  - Empty/no-match case returns defined empty response.
- **Determinism:** fixed dates (freeze/travel to a known “today”), fixed records/amounts/currencies.

## 6. Implementation steps (suggested order)

1. **Backend routing & action:** add `GET /v1/analytics` (dedicated controller), build current-salary scope with joins and filters.
2. **Aggregation logic:** implement currency consistency check and total/average/median computation; define/return response and error shapes.
3. **Backend tests:** request specs covering scoping, aggregates, filters, mixed-currency, and auth/empty cases.
4. **Frontend API & routing:** add `getSalaryAnalytics`, route, and sidebar **Analytics** entry.
5. **Frontend UI:** implement analytics view with filter controls, apply/clear, results display, and loading/empty/error (mixed-currency) states.
6. **Verification:** manual end-to-end pass with seeded/created data across currencies, locations, and periods.

## 7. Open points to confirm

- **Filter params:** use `filter[department_id]`, `filter[location_id]`, `filter[city]` (partial, case-insensitive), `filter[state_code]` (exact, normalized), `filter[job_title]` (partial, case-insensitive) — matching requirements (`state code` implemented as `state_code`). OK?
- **Response shape:** return `{ "analytics": { "currency", "count", "total", "average", "median" } }` (and optionally echo applied filters); for no matches return `count: 0` with zero/null aggregates (finalized in implementation) — OK?
- **Mixed-currency error:** 422 with a clear `{ "error": "..." }` message prompting the user to filter to a single currency — OK?
- **Median/precision:** compute median correctly for even/odd counts; return monetary values with consistent precision/formatting (e.g. 2 decimal places, as strings or numbers — consistent with API conventions). OK?
- **UI placement:** add a dedicated **Analytics** sidebar item/page (e.g. `/analytics`) with filter controls and results — OK?

---

**References:** `artifacts/requirements.md` (Analytics behavior, filters, mixed-currency rule), `artifacts/plan.md` (Phase 3 Module 5, dependencies), and patterns from Modules 1–4 (`filter[...]`, relation joins, shared helpers, protected routing, MUI UI components).
