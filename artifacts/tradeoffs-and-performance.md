# Trade-offs and Performance Considerations

## Product & scope trade-offs

- **HR-only access in v1:** focused on HR workflows (no employee self-service, no ticketing, no payroll/tax documents, no currency conversion/aggregation across currencies) to deliver a usable core system quickly and match the stated scope.
- **Invite/provisioned HR users over open registration:** reduces access risk and aligns with `@official.com` policy; adds invite/reset flows and seeded bootstrap admin (`hr@official.com`).
- **Essential CRUD before advanced workflows:** create/read/update for core entities (no delete where history/record-keeping matters) to preserve auditability and keep behavior predictable.
- **Pragmatic UI over heavy customization:** standard MUI components and modular pages for clarity/maintainability; iterative UX improvements (e.g. analytics filters/typeahead, clearer labels) added where they improved usability without large complexity.

## Technical & design trade-offs

- **Rails API + React SPA:** clear separation of concerns and independent evolution of backend/frontend; requires CORS/auth handling and API contract discipline.
- **JWT (stateless) auth:** simple API authentication for SPA clients and protected endpoints; requires careful token handling/expiry/sign-out semantics and secure storage practices on the client.
- **Relational schema with explicit constraints:** MySQL + foreign keys/unique constraints/indexes enforce integrity and support reporting/filtering; schema changes managed via migrations.
- **Business rules in backend/domain layer:** salary total derivation, period overlap checks, and auto-close of previous open salary enforced server-side to ensure correctness regardless of client behavior (frontend provides previews/feedback only).
- **Server-side pagination/filtering:** necessary at ~10k employees and growing salary history; trades some client simplicity for scalability and predictable response sizes.
- **Analytics endpoint design:** dedicated `GET /v1/analytics` computes aggregates in the backend over **current** salaries (with relation-based filters) and rejects mixed-currency sets rather than performing implicit conversion—correct and explicit, but requires users to narrow filters for cross-currency views.
- **Reusable helpers vs. flexibility:** shared filter/pagination/serialization helpers and UI components reduce duplication; specialized cases (joined/relation filters, dependent/async filter controls) kept explicit where abstraction would hurt clarity.

## Performance considerations

- **Pagination:** all list endpoints paginate responses (`page[number]`, `page[size]`) and UIs navigate pages to avoid large payloads.
- **Indexing:** indexes on key/filtered fields and foreign keys (e.g. employee/department/job/currency/dates/location codes and relevant uniques) support common lookups, filters, joins, and analytics queries.
- **Denormalization for query simplicity:** salary records store `currency`, `job_title`, and server-derived `total_amount` directly, reducing runtime derivation and simplifying filtering/aggregation.
- **Database-backed aggregation:** analytics uses SQL/ActiveRecord aggregation over filtered current-salary scope (count/sum/median computation) rather than loading unnecessary records into the client.
- **Efficient seeding:** seed script uses batched/bulk inserts and precomputed valid data (including non-overlapping histories/current records and totals) to generate ~10k employees and related records reproducibly and in reasonable time.
- **Frontend data loading:** targeted API calls per view, debounced async suggestions (job titles), and dependent filter option derivation to limit unnecessary requests; further optimizations (caching, virtualization for very large option sets, query tuning/EXPLAIN-driven indexes) can be added as usage grows.
- **Current-salary definition:** analytics/current logic is date-based (`applicable_from <= today` and open or not expired) for correctness; queries rely on indexed date fields and can be further optimized if datasets grow significantly.

## Testing & reliability trade-offs

- **Backend-first automated tests:** RSpec (models + requests) prioritized for correctness-critical rules (auth, validations, salary period/total behavior, analytics). Fast, deterministic tests favored over exhaustive permutations.
- **Limited frontend automated tests:** UI tests deferred (per scope/constraints); confidence supported by backend coverage, manual/end-to-end checks, and Dockerized demo environment.
- **Determinism:** time-dependent behavior tested with fixed dates/time helpers; seed uses deterministic generation for reproducible demo data.
