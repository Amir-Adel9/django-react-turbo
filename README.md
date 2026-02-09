# DigiSay Task Manager

Monorepo: **API** (Django + PostgreSQL) and **Web** (React + Vite). No env files are required for a quick run; sensible defaults are built in.

## Table of contents

- [Live Demo](#live-demo)
- [Principles](#principles)
- [Technical Decisions](#technical-decisions--justifications)
- [Scope](#scope)
- [Requirements](#requirements)
- [Package manager](#package-manager)
- [Setup and run](#setup-and-run)
- [Testing](#testing)

## Live Demo

> ⚠️ **Note:** This demo is served over **HTTP** not **HTTPS**. 
> Some platforms (including GitHub) may try to auto-upgrade links to HTTPS.
> <br> If the link doesn't load when clicked, **remove the `s` from `https`** in the address bar.

**[Live Demo](http://srv989705.hstgr.cloud:8000/)** — Deployed on my personal VPS. Try it out.

## Principles

- **Monorepo:** [Turborepo](https://turbo.build/repo) with `apps/api` (Django + PostgreSQL), `apps/web` (React + Vite), and `packages/api-contract` (OpenAPI schema and generated types for the frontend).
- **Auth:** Cookie-based sessions only: httpOnly `access_token` and `refresh_token`; refresh path-restricted; no auth state in `localStorage`.
- **Security:** The project uses a **Dual-Token Rotation** strategy with **httpOnly** cookies: access and refresh tokens are stored only in httpOnly cookies, the refresh token is path-scoped to `/api/auth/refresh` and rotated on refresh; no tokens in `localStorage` or client-side JS.
- **Contract:** API surface is described by OpenAPI; the web app uses `openapi-fetch` and types generated from `api-contract`.
- **CI/CD:** Automated pipeline runs on push/PR to `main`: install, lint, build, type checking, unit tests, and E2E tests; PostgreSQL is provided via Docker for local development, production, and CI.
- **Defaults:** The app runs with `pnpm install` and `pnpm start:dev` (or `npm start:dev` / `yarn start:dev`) with Docker PostgreSQL; env is optional for overrides.

## Technical Decisions & Justifications

Reasoning behind key choices:

- **httpOnly cookies** — Access and refresh tokens live only in httpOnly cookies (never in `localStorage` or client JS). This mitigates XSS: injected script cannot read tokens. Combined with SameSite and CSRF protection, we get defense-in-depth. Rotating the refresh token on use limits the impact of token leakage.
- **Refresh token path-restricted to `/api/auth/refresh`** — The refresh cookie is scoped with `Path=/api/auth/refresh`, so the browser sends it only to that endpoint. Attack surface is reduced: even if an attacker obtains a reflected XSS or similar, the cookie is not sent to arbitrary API routes—only to the dedicated refresh endpoint.
- **openapi-fetch for type-safe API calls** — The web app uses `openapi-fetch` with types generated from the OpenAPI schema in `api-contract`. We get end-to-end type safety from schema to client (paths, request/response types) with no runtime overhead and no hand-maintained DTOs. Changes to the API surface show up as compile-time errors in the frontend.
- **React Router for navigation** — Uses React Router v7 with route-based code splitting and protected routes. Auth checks run before component render to prevent FOUC (Flash of Unauthenticated Content).
- **pnpm for dependency management** — pnpm gives fast, disk-efficient installs and strict dependency resolution (no phantom dependencies). The lock file is deterministic and CI/local installs stay consistent. It's the default choice here, though the repo works fine with npm, Yarn, or Bun.
- **Django REST Framework** — Provides robust API building with built-in authentication, serialization, filtering, and pagination. DRF Spectacular generates OpenAPI schemas automatically from Django views.
- **PostgreSQL** — Robust relational database with excellent Django support, ACID compliance, and advanced features like full-text search and JSON fields.

## Scope

### Authentication

- `POST /api/auth/register` — User registration
- `POST /api/auth/login` — User login (returns httpOnly cookies)
- `POST /api/auth/refresh` — Refresh access token (path-restricted cookie)
- `POST /api/auth/logout` — User logout (clears cookies)
- `GET /api/auth/me` — Get current user (protected)

Authentication is cookie-based with `httpOnly` cookies:

- `access` cookie for authenticated API requests
- `refresh` cookie for token rotation (`Path=/api/auth/refresh`)

### Tasks

- `GET /api/tasks` — List tasks (filtered by user, supports pagination, filtering by status/date range)
- `POST /api/tasks` — Create a single task
- `POST /api/tasks/bulk` — Bulk create tasks (JSON or CSV)
- `GET /api/tasks/{id}` — Get a single task
- `PATCH /api/tasks/{id}` — Update a task
- `DELETE /api/tasks/{id}` — Delete a task
- `GET /api/tasks/stats` — Get task statistics (counts by status)
- `GET /api/tasks/export` — Export tasks to Excel (.xlsx)

All task endpoints are protected and automatically filter by the authenticated user.

## Requirements

- **Node** ≥18
- **pnpm**, **npm**, **Yarn**, or **Bun**
- **Docker** (for PostgreSQL in dev and for the full prod stack)
- **Python** ≥3.10 (for local API development, optional)

## Package manager

All root scripts use Turborepo and work with **pnpm**, **npm**, **Yarn**, or **Bun**. Use the same commands with your preferred manager (e.g. `pnpm start:dev`, `npm run start:dev`, `yarn start:dev`, or `bun run start:dev`).

## Setup and run

**Clone and install:**

```sh
git clone <repo-url>
cd <repo>
pnpm install
# or: npm install
# or: yarn
# or: bun install
```

**Development:** Start PostgreSQL, then run API and web via Turbo.

```sh
pnpm db:up
pnpm start:dev
# or: npm run db:up && npm run start:dev
# or: yarn db:up && yarn start:dev
# or: bun run db:up && bun run start:dev
```

- **API:** http://localhost:8000
- **Web:** http://localhost:5173 (proxies `/api` to the API)

**Production (all in Docker):**

```sh
pnpm start:prod
# or: npm run start:prod
# or: yarn start:prod
# or: bun run start:prod
```

- App: http://localhost:8000 (override with `GATEWAY_PORT` in `.env` if needed)

**Optional env:** Copy `.env.example` to `.env` at the repo root. Main variables:

| Variable                | Description                                     |
| ----------------------- | ----------------------------------------------- |
| `GATEWAY_PORT`          | Host port for the prod gateway (default `8000`) |
| `POSTGRES_DB`           | PostgreSQL database name (default `task_manager_db`) |
| `POSTGRES_USER`         | PostgreSQL user (default `task_manager_user`)    |
| `POSTGRES_PASSWORD`     | PostgreSQL password (default `task_manager_password`) |
| `SECRET_KEY`            | Django secret key (change in production!)       |
| `DEBUG`                 | Django debug mode (default `True` in dev)       |
| `ALLOWED_HOSTS`         | Comma-separated list of allowed hosts          |
| `ADMIN_SEED_PASSWORD`   | Password for default admin user (default `admin123!`) |

## Testing

Use the same root scripts with pnpm, npm, Yarn, or Bun (e.g. `pnpm test`, `npm run test`, `yarn test`, `bun test`).

### Test Structure

- **Backend unit tests:** `apps/api/apps/*/tests/test_*.py` - Test models, serializers, views, services, filters
- **Backend E2E tests:** `apps/api/tests/e2e/test_*.py` - Test complete API flows
- **Frontend unit tests:** `apps/web/src/**/*.test.tsx` - Test components, hooks, utilities

### Running Tests

**All tests:**
```sh
pnpm test:all
# or: npm run test:all
# or: yarn test:all
# or: bun run test:all
```

**API unit tests:**
```sh
pnpm test:api
# or from apps/api: uv run pytest apps/ -v
```

**Web unit tests:**
```sh
pnpm test:web
# or from apps/web: pnpm test
```

**API E2E tests:**
```sh
pnpm test:e2e:api
# Requires PostgreSQL running (use pnpm db:up)
```

**Test coverage:**
```sh
pnpm test:coverage
# or: npm run test:coverage
# or: yarn test:coverage
```

### Test Commands Reference

| Command | Description |
|---------|-------------|
| `pnpm test` | Run all unit tests (API + Web) |
| `pnpm test:api` | Run API unit tests only |
| `pnpm test:web` | Run web unit tests only |
| `pnpm test:e2e:api` | Run API E2E tests |
| `pnpm test:all` | Run all unit tests + API E2E tests |
| `pnpm test:coverage` | Run tests with coverage reports |

**Type checking:** `pnpm check-types` (or `npm run check-types` / `yarn check-types` / `bun run check-types`)

**Linting:** `pnpm lint` (or `npm run lint` / `yarn lint` / `bun run lint`)

## Default admin (API)

After migrating the API, run `python manage.py seed_admin` (or use the Docker image, which runs it on startup). Default admin: **admin@example.com** / **admin123!** (set `ADMIN_SEED_PASSWORD` in production).

## Useful Links

Learn more about the power of Turborepo:

- [Tasks](https://turborepo.dev/docs/crafting-your-repository/running-tasks)
- [Caching](https://turborepo.dev/docs/crafting-your-repository/caching)
- [Remote Caching](https://turborepo.dev/docs/core-concepts/remote-caching)
- [Filtering](https://turborepo.dev/docs/crafting-your-repository/running-tasks#using-filters)
- [Configuration Options](https://turborepo.dev/docs/reference/configuration)
- [CLI Usage](https://turborepo.dev/docs/reference/command-line-reference)
