# FullStack Pilot – a full-stack starter kit

[![Build frontend image](https://github.com/koydas/fullstack-pilot/actions/workflows/build-frontend.yml/badge.svg)](https://github.com/koydas/fullstack-pilot/actions/workflows/build-frontend.yml)
[![Build backend images](https://github.com/koydas/fullstack-pilot/actions/workflows/build-backend.yml/badge.svg)](https://github.com/koydas/fullstack-pilot/actions/workflows/build-backend.yml)

[![Package MongoDB image](https://github.com/koydas/fullstack-pilot/actions/workflows/mongo-db.yml/badge.svg)](https://github.com/koydas/fullstack-pilot/actions/workflows/mongo-db.yml)
[![Package PostgreSQL image](https://github.com/koydas/fullstack-pilot/actions/workflows/postgre-db.yml/badge.svg)](https://github.com/koydas/fullstack-pilot/actions/workflows/postgre-db.yml)
[![Package MSSQL image](https://github.com/koydas/fullstack-pilot/actions/workflows/mssql.yml/badge.svg)](https://github.com/koydas/fullstack-pilot/actions/workflows/mssql.yml)

[![Smoke tests](https://github.com/koydas/fullstack-pilot/actions/workflows/smoke-tests.yml/badge.svg)](https://github.com/koydas/fullstack-pilot/actions/workflows/smoke-tests.yml)

A showcase repository ready to demo end-to-end skills: React on the UI, a Node/Express + MongoDB core API, plus bonus Flask and .NET microservices to illustrate a polyglot environment. Everything is scripted to launch in minutes, so you can focus on telling the product story.

## Why this repo gets attention
- **Candidate-to-production flow**: initialization scripts for dependencies, a single `docker compose up --build` to bring up the full stack, configured proxies, and smoke tests for every service.
- **Credible architecture**: Vite frontend, Node/Mongo API, Python/.NET services behind dedicated routes, and a mermaid data-flow overview.
- **Review-ready defaults**: ESLint/Prettier, modern JavaScript on the client, consistent CRUD contracts, and per-service `.env` configuration.
- **Fast demo path**: project CRUD on MongoDB reachable via `/api/apps` and the UI.

## Architecture at a glance
```mermaid
flowchart LR
  UI[React + Vite client]
  API[Node/Express apps-service]
  DB1[(MongoDB)]
  DB2[(PostGre)]
  DB3[(MSSQL)]
  PY[Flask services-service]
  DOTNET[.NET dependancies-service]

  UI -->|/api apps| API
  API --> DB1
  PY --> DB2
  DOTNET --> DB3
  UI -->|/api services| PY
  UI -->|/api/dependancies| DOTNET
```

## Quick start
1. **Install Node dependencies**
   ```bash
   npm run init:services
   npm run init:client
   ```
2. **Create the environment file**
   ```bash
   cat > services/.env <<'EOF'
   MONGODB_URI=mongodb://localhost:27017/fullstack-pilot
   PORT=4000
   EOF
   ```
3. **Start the core stack** (Node API + Mongo + React)
   ```bash
   npm run start:mongo-db
   npm run start:services
   cd client && npm run dev -- --host
   ```
   - Frontend: http://localhost:5173 (proxy `/api` → backend)
   - Node API: http://localhost:4000/api
4. **Optional services**
   - Flask: `npm run start:services-service` (`http://localhost:5000/api`)
   - .NET: `npm run start:dependancies-service` (routes `/api/dependancies`, Swagger: `http://localhost:6060/swagger`)
   - MongoDB helper: `npm run start:mongo-db` (connection string `mongodb://localhost:27017/fullstack-pilot`)
   - PostgreSQL helper: `npm run start:postgre` (connection string `postgres://fullstack:fullstack@localhost:5432/fullstack-pilot`)

### One-command launch
```bash
docker compose up --build
```
Exposes: frontend (5173), Node API (4000), Flask API (5000), .NET API (6060), MongoDB (27017).
Rebuild after changes with `docker compose up --build`. Stop with `docker compose down`.

## Directory tour
- `client/` – React + JavaScript UI built with Vite. See the [client README](client/README.md).
- `apps-service/` – Node/Express API connected to MongoDB.
- `services/services-service/` – Flask CRUD service. Overview in the [services-service README](services/services-service/README.md).
- `services/dependancies-service/` – .NET 8 CRUD service. Details in the [dependancies-service README](services/dependancies-service/README.md).
- `services/` – cross-service scripts and notes (see [services README](services/README.md)).
- `databases/mongo-db/` – docker-compose for local Mongo (see [mongo-db README](databases/mongo-db/README.md)).
- `databases/postgre/` – Dockerfile for a local PostgreSQL helper (see [postgre README](databases/postgre/README.md)).

## Primary API (apps-service)
- `GET /api/apps` – list projects
- `POST /api/apps` – create a project `{ "name": "My project" }`
- `DELETE /api/apps/:id` – delete by id

## Ready-made smoke tests
Each service includes a self-contained POST → GET → DELETE script (see [.devops/tests/smoke](.devops/tests/smoke/README.md)). Run them once the service is up:
- Node/Mongo: `./scripts/api-smoke.sh` (env override: `APPS_API_URL` or `API_URL`)
- Flask: `./scripts/services-smoke.sh` (override: `SERVICES_API_URL`)
- .NET: `./scripts/dependancies-smoke.sh` (override: `DEPENDANCIES_API_URL`)
- MongoDB helper reachability: included in `npm run test:smoke` (override with `SMOKE_MONGO_URL`)
- PostgreSQL helper reachability: included in `npm run test:smoke` (override with `SMOKE_POSTGRES_URL`)

## Deploying to production
- Point `MONGODB_URI` to your managed cluster.
- Build the frontend: `cd client && npm run build`, then serve `dist/` behind your reverse proxy pointed at the API.
- Recommended next steps: CI (lint, type-check, tests), seeds + UI/API E2E, vaulted secrets, healthchecks, JWT auth, centralized logging/metrics.

## Roadmap
The backlog and evaluation checklist live in [GitHub Issues](https://github.com/AndrewHulme/fullstack-pilot/issues).
