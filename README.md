# FullStack Pilot

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
   - .NET service: `npm run start:dependancies-service` (port 6060, needs SQL Server credentials from `MSSQL_SA_PASSWORD`).

## Architecture overview
- **client (5173)** → React/Vite UI served via Nginx in Compose; proxies `/api` to the Node API.
- **apps-service (4000)** → Node/Express CRUD API backed by MongoDB.
- **services-service (5000)** → Flask CRUD service using PostgreSQL.
- **dependancies-service (6060)** → .NET 8 API using SQL Server (Swagger at `/swagger`).
- **databases** → MongoDB (27017), PostgreSQL (5432), SQL Server (1433) helpers for local/dev.
- **Visual:** the mermaid architecture diagram lives in [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md).

## Project conventions
- **Naming/layout:** backend services live under `services/<name>-service` with their own `package.json` (or equivalent) and Dockerfile; the React app lives in `client/`.
- **Environment:** each service reads from a local `.env` file when present (e.g., `PORT`, `MONGODB_URI`, `POSTGRES_DSN`, `ASPNETCORE_URLS`, `ConnectionStrings__DependanciesDb`).
- **Adding a service:** create `services/<new-service>`, include a runnable dev script (`npm run dev` or `start`), add a Dockerfile, expose a unique port, and wire it into `docker-compose.yml` (and `.devops` manifests if you want GitOps support).
- **Scripts to know:** `npm run init` installs all service/client dependencies; `npm run start:services` starts every service that has a `dev`/`start` script; smoke tests live under `.devops/tests/smoke/`.
