# Salary Manager

HR-only employee salary management application built with a **Ruby on Rails (API)** backend, **React + MUI** frontend, and **MySQL**.

It supports HR authentication (Devise + JWT), management of locations/departments/employees, salary history/current compensation tracking, and per-currency salary analytics over current salaries. The app is designed for ~10k employees and ships with a reproducible seed script.

<img width="300" alt="image" src="https://github.com/user-attachments/assets/4d85f467-65d5-451b-b55c-679503fd61a6" />
<img width="300" alt="image" src="https://github.com/user-attachments/assets/5c4fff05-70b3-41bb-999c-43ebcbdc01f0" />
<img width="300" alt="image" src="https://github.com/user-attachments/assets/ea3430ab-7ea7-486f-9612-dcc5c94f8b8a" />


## Features

- **Authentication (HR-only):** sign in/out via JWT (`Authorization: Bearer <token>`), password reset, invite/activation flow, provisioned HR users (`@official.com` emails). No employee self-service.
- **Locations:** city/state/country (Carmen-validated), filtering, pagination.
- **Departments:** linked to location with optional department head, filtering, pagination.
- **Employees:** profile/employment details, validations (e.g. age ≥ 18, unique code/email/phone), directory with filters/pagination, no delete (history preserved).
- **Salaries:** salary history per employee (monthly components + server-derived total, currency), open-ended current record, non-overlapping periods, auto-close of previous open record on create, filtering/pagination.
- **Analytics:** `GET /v1/analytics` aggregates **current applicable salaries** (count/total/average/median) per currency with filters; rejects mixed-currency result sets with a clear error.
- **Demo data:** reproducible seed for ~10k employees across multiple countries/currencies with locations, departments, and salary histories.

## Repository structure

- `backend/` — Rails API (`/v1`), MySQL, RSpec tests
- `frontend/` — React + Vite + MUI SPA
- `artifacts/` — requirements and implementation plans

## Quick start with Docker (recommended)

The easiest way to run the full stack (MySQL + backend + frontend) locally:

```bash
docker compose up --build
```

- **Frontend:** [http://localhost:5173](http://localhost:5173)
- **Backend API:** [http://localhost:3000/v1](http://localhost:3000/v1) (health: `GET /v1/health`)
- **HR login:** `hr@official.com` / `Password123!`

**Notes**
- On first boot the backend runs `db:prepare` and `db:seed`, which creates schema and demo data (including ~10k employees). The initial seed can take a few minutes; subsequent starts skip bulk reseeding if data already exists.
- MySQL data is persisted in a Docker volume (`mysql_data`). To reset everything: `docker compose down -v`.
- To stop: `docker compose down` (or `Ctrl+C` in the attached session).

## Local development (without Docker)

### Prerequisites

- **Ruby** 3.4.5 (project used with RVM gemset `3.4.5@salary-manager`)
- **Bundler**
- **MySQL** 8+ running locally (default: `127.0.0.1:3306`, user `root`, no password; configurable via `DB_HOST`, `DB_USERNAME`, `DB_PASSWORD`, `DB_PORT`)
- **Node.js** (v22.x recommended) and **npm**

### Backend setup & run

```bash
cd backend
# use the project Ruby/gemset if applicable
# rvm use 3.4.5@salary-manager

bundle install
bin/rails db:create db:migrate
bin/rails db:seed
bin/rails server -p 3000
```

- API base URL: `http://localhost:3000/v1`
- Health check (public): `GET /v1/health`
- Seeded HR login (development default): `hr@official.com` / `Password123!`
  - Override seed password with `SEED_HR_PASSWORD` (required in non-dev/test environments).

### Frontend setup & run

```bash
cd frontend
npm install
npm run dev
```

- Vite dev server starts (typically `http://localhost:5173`).
- API base URL defaults to `http://localhost:3000/v1`. Override with:

```bash
VITE_API_BASE_URL=http://localhost:3000/v1 npm run dev
```

## Seeding data (~10k employees)

The seed script is reproducible and idempotent in behavior:

```bash
cd backend
bin/rails db:seed
# or customize count (default 10000)
SEED_EMPLOYEE_COUNT=10000 bin/rails db:seed
```

- Ensures HR user `hr@official.com`.
- If employee count is already >= target, skips bulk reseed.
- Otherwise (re)creates domain data: locations, departments, ~10k employees, and salary histories/current records in varied currencies (INR, USD, EUR, GBP, JPY, AUD, CAD, SGD, AED, BRL), with department heads assigned.
- Bulk-seeded for efficiency; intended for demo/stabilization and analytics exploration.

## Running tests (backend)

RSpec + FactoryBot cover core model and request behavior (auth, CRUD/filter/pagination, salary rules, analytics).

```bash
cd backend
# rvm use 3.4.5@salary-manager
RAILS_ENV=test bin/rails db:test:prepare
bundle exec rspec
```

## API notes

- Versioned JSON API under `/v1`.
- Auth: obtain JWT via sign-in and send `Authorization: Bearer <token>` to protected endpoints.
- Pagination: `page[number]`, `page[size]` with `meta` in responses.
- Filtering: `filter[...]` query params (resource-specific).
- Analytics: `GET /v1/analytics` over current salaries; filter to a single currency to avoid mixed-currency errors.

## Development notes

- After backend route/controller/config changes, restart the Rails server.
- Salary `total_amount` is server-derived; period/overlap/current-record rules are enforced by the backend.
- Frontend does not currently include automated UI tests (per requirements); backend RSpec is the primary automated suite.
