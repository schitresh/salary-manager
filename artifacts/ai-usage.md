# AI Usage and Development Process

## Tools & context

- **Primary development assistant:** agentic AI coding assistant used within the repository workspace to plan, implement, refactor, test, and document the solution.
- **Human role:** provided goals/requirements, reviewed outputs, made product/UX decisions (e.g. analytics filter behavior/order, cascade design), confirmed plans/preferences (e.g. RSpec + FactoryBot), and validated behavior.

## How AI was used (intentional, iterative)

- **Planning before implementation:** created and refined requirements and phased/module plans (`artifacts/requirements.md`, `artifacts/plan.md`, phase/module plans) to define scope, contracts, and sequencing before coding slices.
- **Incremental, vertical-slice delivery:** implemented the system in stages (setup/integration baseline → auth → domain modules: locations, departments, employees, salaries, analytics → tests → seed → stabilization/docs → Docker), keeping changes runnable and reviewable.
- **Codebase-aware changes:** inspected existing models/controllers/routes/frontend components before modifying behavior; aligned new code with established patterns (API envelopes, pagination/filter params, shared UI helpers).
- **Refinement based on feedback:** iterated on UX and behavior from user requests (e.g. analytics endpoint/refinements, filter reordering, async job-title suggestions, country→state cascade, restoring location filter, clearer department labels) and applied targeted fixes (including Docker startup/port issues).
- **Verification:** ran and stabilized automated checks during development (RSpec suite, frontend build) and sanity-checked seeded data/analytics behavior; added tests for newly introduced backend behavior (e.g. job-title suggestions endpoint, country filter support).

## Prompts / instructions pattern (crux)

Interactions were iterative and context-dependent: later requests assumed the established requirements, plans, API conventions, and implemented modules. The crux of prompts at each stage was:

### 1. State goal or issue
- **Advance the roadmap with a scoped deliverable** (e.g. implement core test coverage for auth, CRUD, salary history rules, and analytics once those modules were in place).
- **Improve a specific workflow/UX with clear behavior** (e.g. refine analytics filtering: reorder fields, add async job-title suggestions, introduce dependent Country→State filtering while retaining direct Location selection and keeping results unambiguous).
- **Correct or align behavior across the app** (e.g. ensure department selection remains exact by ID but displays location context wherever departments are chosen/listed).

### 2. Provide constraints/preferences
- **Technical choices and priorities:** preferred test stack (RSpec + FactoryBot) and focus on correctness-critical, deterministic cases (salary total/period/overlap/auto-close, current-salary analytics aggregates/median/filters, mixed-currency rejection, auth/validation/pagination behavior).
- **Domain/API rules:** analytics over current applicable salaries only, per-currency aggregation with explicit mixed-currency errors, and filters resolved consistently through related models.
- **Scope/complexity control:** favor simpler, unambiguous filter semantics and phased changes (validate high-value UX improvements before broader adjustments).

### 3. Review proposed plan/changes and request adjustments
- **Approve or revise approach before coding** (e.g. update plans to match chosen tooling/coverage, then proceed).
- **Refine design for clarity and risk reduction** (e.g. drop redundant/ambiguous filter dimensions, keep Location alongside Country→State, and stage implementation).
- **Tighten semantics/consistency** (e.g. make department options self-describing by including location given exact department selection).

### 4. Ask to implement/verify/commit
- **Implement with correctness checks:** deliver the agreed slice, add/update tests for critical and newly changed behavior, run the relevant/full test suite (and build where applicable), resolve failures, and commit incrementally.
- **Validate end-to-end impact:** ensure API contracts, UI behavior, and shared helpers remain consistent after refactors or UX changes.
- **Review for gaps:** reassess against requirements after changes and cover any meaningful missing verification.

## Quality & correctness practices

- **Maintainability:** preferred small, coherent changes; reused/introduced shared helpers where high-ROI; kept commits incremental.
- **Correctness-first for critical logic:** enforced key business rules and validations in backend/domain layer; backed by request/model specs.
- **Traceability:** committed artifacts and code evolution in Git history so design and implementation decisions can be reviewed over time.
