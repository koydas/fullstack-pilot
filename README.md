# FullStack Pilot
---
[![Build frontend image](https://github.com/koydas/fullstack-pilot/actions/workflows/build-frontend.yml/badge.svg)](https://github.com/koydas/fullstack-pilot/actions/workflows/build-frontend.yml)
[![Build backend images](https://github.com/koydas/fullstack-pilot/actions/workflows/build-backend.yml/badge.svg)](https://github.com/koydas/fullstack-pilot/actions/workflows/build-backend.yml)

[![Package MongoDB image](https://github.com/koydas/fullstack-pilot/actions/workflows/mongo-db.yml/badge.svg)](https://github.com/koydas/fullstack-pilot/actions/workflows/mongo-db.yml)
[![Package MSSQL image](https://github.com/koydas/fullstack-pilot/actions/workflows/mssql.yml/badge.svg)](https://github.com/koydas/fullstack-pilot/actions/workflows/mssql.yml)
[![Package PostgreSQL image](https://github.com/koydas/fullstack-pilot/actions/workflows/postgre-db.yml/badge.svg)](https://github.com/koydas/fullstack-pilot/actions/workflows/postgre-db.yml)

[![Smoke tests](https://github.com/koydas/fullstack-pilot/actions/workflows/smoke-tests.yml/badge.svg)](https://github.com/koydas/fullstack-pilot/actions/workflows/smoke-tests.yml)
[![Playwright E2E](https://github.com/koydas/fullstack-pilot/actions/workflows/playwright-e2e.yml/badge.svg)](https://github.com/koydas/fullstack-pilot/actions/workflows/playwright-e2e.yml)
---
## What this repo demonstrates (Hiring manager view)
- Polyglot stack standing up quickly: React/Vite UI, Node/Express API on MongoDB, plus optional Flask (Postgres) and .NET (SQL Server) services.
- Practical operational story: Docker Compose definitions, per-service Dockerfiles, and smoke-test scripts for each backend.
- Review-ready defaults: lintable frontend, environment-based config, and repeatable init scripts for dependencies.

## Goals / Non-goals
- **Goals:** show end-to-end CRUD across a polyglot data layer (MongoDB, PostgreSQL, SQL Server), demonstrate multi-service wiring, and keep setup friction low.
- **Non-goals:** production hardening (auth, observability), extensive test coverage, or cloud-specific deployment templates.

## Prerequisites
- Node.js (18+ recommended)
- Docker and Docker Compose

## Quick start
### Path 1: Docker Compose (everything in containers)
1. `docker compose up --build`
2. Browse the services:
   - Client UI: http://localhost:5173
   - Node/Express API: http://localhost:4000/api
   - Flask API: http://localhost:5000/api
   - .NET API (+ Swagger): http://localhost:6060 (Swagger at `/swagger`)
   - Datastores: MongoDB 27017, PostgreSQL 5432, SQL Server 1433
3. Stop with `docker compose down`.

### Path 2: Local (without docker-compose)
1. Install dependencies: `npm run init` (installs all services and the client).
2. Ensure MongoDB is reachable at `mongodb://localhost:27017/fullstack-pilot` (start your own instance or run the helper `npm run start:mongo-db`).
3. In one terminal: `npm run start:apps-service` (starts the Node API on port 4000).
4. In another terminal: `npm run start:client` (starts Vite on http://localhost:5173 with proxying to the API).
5. Optional extras (run with their own prerequisites):
   - Flask service: `npm run start:services-service` (port 5000, needs PostgreSQL at `postgres://fullstack:fullstack@localhost:5432/fullstack-pilot`).
   - .NET service: `npm run start:dependencies-service` (port 6060, needs SQL Server credentials from `MSSQL_SA_PASSWORD`).

## Architecture overview
This repo intentionally splits responsibilities across independent services so each boundary demonstrates a practical technology choice and the data ownership model behind it, rather than a single “best stack” answer.

- **client (React/Vite + Nginx, port 5173)**
  - **Why this choice:** React/Vite keeps local feedback loops fast and familiar for frontend-heavy teams, while Nginx provides a production-like static hosting and reverse-proxy edge in Compose.
  - **Data ownership boundary:** The client owns UI state and interaction flow, but does not own persistent business data; it consumes backend APIs as the system of record.
  - **Trade-off:** Fast iteration and simple deployment at the edge vs. added complexity of managing API contracts and proxy behavior between UI and services.

- **apps-service (Node/Express + MongoDB, port 4000)**
  - **Why this choice:** Node/Express minimizes ceremony for CRUD APIs and aligns with JavaScript-heavy teams; MongoDB complements this with schema-flexible documents for quickly evolving payloads.
  - **Data ownership boundary:** This service is the source of truth for its document domain and owns lifecycle rules for Mongo-backed records.
  - **Trade-off:** High development speed and flexible schema evolution vs. weaker relational guarantees than a normalized SQL model.

- **services-service (Flask + PostgreSQL, port 5000)**
  - **Why this choice:** Flask provides a lightweight Python service surface, and PostgreSQL offers mature relational modeling and transactional integrity for structured entities.
  - **Data ownership boundary:** This service owns relational data and consistency rules that benefit from SQL constraints and ACID transactions.
  - **Trade-off:** Strong integrity and query power vs. more up-front schema design and migration discipline than document stores.

- **dependencies-service (.NET 8 + SQL Server, port 6060)**
  - **Why this choice:** .NET 8 demonstrates enterprise-oriented service implementation, and SQL Server reflects compatibility with common Microsoft-centric production environments.
  - **Data ownership boundary:** This service owns SQL Server-backed dependency data and encapsulates its contract through its API and Swagger surface.
  - **Trade-off:** Strong tooling and enterprise interoperability vs. a heavier runtime/toolchain footprint for local contributors.

- **databases (MongoDB, PostgreSQL, SQL Server)**
  - **Why this choice:** Running all three datastores locally demonstrates polyglot persistence patterns and lets each service use the storage model that best matches its domain constraints.
  - **Data ownership boundary:** Each datastore is scoped to its owning service boundary rather than shared as a single cross-service schema.
  - **Trade-off:** Clear ownership and fit-for-purpose storage vs. increased operational overhead in local setup, CI, and developer onboarding.

- **Visual:** the mermaid architecture diagram lives in [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md).

## Architecture decisions
- **Service isolation.** Each backend is independently runnable, testable, and containerized so teams can iterate or replace one service without tightly coupling release cadence to the others; this increases resilience of change but also introduces cross-service contract and orchestration overhead.

- **Polyglot persistence.** The repo intentionally pairs services with different datastores (MongoDB, PostgreSQL, SQL Server) to show that storage is a domain decision, not a one-size-fits-all platform choice; this improves data-model fit while making operations and skill requirements broader.

- **GitOps deployment model.** Deployment artifacts and automation live alongside source so infrastructure changes follow the same review and versioning workflow as application code; this improves traceability and repeatability, with the trade-off of maintaining deployment manifests as first-class code.

- **Local-first developer experience.** Docker Compose, helper scripts, and dev-friendly defaults prioritize “clone and run” onboarding for mixed-language services; this reduces setup friction but accepts some parity gaps versus hardened production environments.

## Decisions
- [Architecture Decision Records (ADRs)](docs/adr/README.md)

## Logging
- **Goal**: each backend emits HTTP request logs (method, path, status, duration) to simplify local debugging and containerized monitoring.
- **Standard output**: services write logs to `stdout`/`stderr`, so they are visible with `docker compose logs -f <service>`.

### Service details
- **apps-service (Node/Express)**  
  - `pino` logger with a `service: "apps-service"` field.
  - Monitoring middleware logs at the end of each request: `method`, `path`, `statusCode`, `durationMs`, and message `"request completed"`.
- **services-service (Flask/Python)**  
  - Structured JSON logging via a custom `JsonFormatter` (`level`, `time`, `service`, `msg` + context).
  - Flask `before_request`/`after_request`/`teardown_request` hooks to trace requests and unhandled errors.
- **dependencies-service (.NET)**  
  - `MonitoringMiddleware` logs each request with `Method`, `Path`, `StatusCode`, and `ElapsedMilliseconds`.
  - Uses `ILogger` (native ASP.NET Core pipeline), compatible with standard log collectors.

### Useful examples
- View logs for a service:
  - `docker compose logs -f apps-service`
  - `docker compose logs -f services-service`
  - `docker compose logs -f dependencies-service`
- Quickly filter errors:
  - `docker compose logs services-service | rg -i "error|exception"`

## GitOps & Deployment
The `.gitops/` directory stores ArgoCD `Application` manifests for each deployable workload, keeping deployment intent versioned with the app code. In this repo, those manifests are:
- `.gitops/client-application.yaml`
- `.gitops/apps-service-application.yaml`
- `.gitops/services-service-application.yaml`
- `.gitops/dependencies-service-application.yaml`
- `.gitops/server-application.yaml`

In a GitOps flow, ArgoCD watches this repository/branch and reconciles cluster state to match these files. Each `Application` points ArgoCD at a target path/revision and destination cluster/namespace; drift in-cluster is corrected back to Git-declared state.

Promotion typically follows an ordered git workflow: merge to `dev` first, validate, then promote the exact commit to `staging` (for example via PR branch promotion or a controlled `git diff`/cherry-pick process). This keeps environment changes auditable and reproducible, because promotions are Git history changes rather than imperative kubectl actions.

## Project conventions
- **Naming/layout:** backend services live under `services/<name>-service` with their own `package.json` (or equivalent) and Dockerfile; the React app lives in `client/`.
- **Environment:** each service reads from a local `.env` file when present (e.g., `PORT`, `MONGODB_URI`, `POSTGRES_DSN`, `ASPNETCORE_URLS`, `ConnectionStrings__DependenciesDb`).
- **Adding a service:** create `services/<new-service>`, include a runnable dev script (`npm run dev` or `start`), add a Dockerfile, expose a unique port, and wire it into `docker-compose.yml` (and `.devops` manifests if you want GitOps support).
- **Scripts to know:** `npm run init` installs all service/client dependencies; `npm run start:services` starts every service that has a `dev`/`start` script; smoke tests live under `.devops/tests/smoke/`.
