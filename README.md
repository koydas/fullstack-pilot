# FullStack Pilot

[![Build frontend image](https://github.com/koydas/fullstack-pilot/actions/workflows/build-frontend.yml/badge.svg)](https://github.com/koydas/fullstack-pilot/actions/workflows/build-frontend.yml)
[![Build backend images](https://github.com/koydas/fullstack-pilot/actions/workflows/build-backend.yml/badge.svg)](https://github.com/koydas/fullstack-pilot/actions/workflows/build-backend.yml)
[![Package MongoDB image](https://github.com/koydas/fullstack-pilot/actions/workflows/mongo-db.yml/badge.svg)](https://github.com/koydas/fullstack-pilot/actions/workflows/mongo-db.yml)

Minimal React + Node.js + MongoDB starter focused on fast evaluation.

## What this project demonstrates
- **Architecture:** Vite React client, Node/Express API, MongoDB persistence, plus optional Flask and .NET sample services to show polyglot patterns.
- **DevOps:** npm scripts bootstrap and start all Node services; Docker Compose for Mongo; environment-based configuration via `.env` files per service.
- **Quality:** TypeScript on the frontend, ESLint/Prettier defaults, and isolated services with consistent CRUD contracts.

## Architecture (Mermaid)
```mermaid
flowchart LR
  UI[React + Vite client]
  API[Node/Express apps-service]
  DB[(MongoDB)]
  PY[Flask services-service]
  DOTNET[.NET dependancies-service]

  UI -->|/api projects| API
  API --> DB
  UI -->|/api services| PY
  UI -->|/api/dependancies| DOTNET
```

## Run locally in 2 minutes
1. **Dependencies**
   ```bash
   npm run init:services
   npm run init:client
   ```
2. **Environment**
   ```bash
   cat > services/.env <<'EOF'
   MONGODB_URI=mongodb://localhost:27017/fullstack-pilot
   PORT=4000
   EOF
   ```
3. **Start core stack** (Node API + Mongo + React)
   ```bash
   cd mongo-db && docker compose up -d && cd ..
   npm run start:services
   cd client && npm run dev -- --host
   ```
   Frontend: `http://localhost:5173` (proxies `/api` to Node). API: `http://localhost:4000/api`.
4. **Optional extras**
   - Flask: `npm run start:services-service` (defaults to `http://localhost:5000/api`).
   - .NET: `npm run start:dependancies-service` (routes under `/api/dependancies`).

## One-command local environment

Bring up the full stack (MongoDB, all APIs, and the production build of the frontend) with Docker Compose from the repository root:

```bash
docker compose up --build
```

Services are available at:
- Frontend: http://localhost:5173/
- Apps API: http://localhost:4000/api
- Flask services API: http://localhost:5000/api
- .NET dependencies API: http://localhost:6000/swagger
- MongoDB: mongodb://localhost:27017/fullstack-pilot

To rebuild after code changes, run `docker compose up --build` again. Use `docker compose down` to stop and remove the containers.

## Project structure
- `client/` – React UI built with Vite.
- `apps-service/` – Node/Express service uses MongoDB.
- `services-service/` – Flask CRUD sample.
- `services/dependancies-service/` – .NET 8 CRUD sample.
- `mongo-db/` – Docker Compose for local MongoDB.

## API overview (apps-service)
- `GET /api/projects` – list projects
- `POST /api/projects` – create a project. Body: `{ "name": "My project" }`
- `DELETE /api/projects/:id` – delete a project by id

## Deployment notes
- Set `MONGODB_URI` to your managed MongoDB connection string.
- Use `npm run build` inside `client/` to create a production build. Serve the static assets with your preferred host and point them at the running backend.

## API smoke tests
Each service ships with a self-contained smoke test script that exercises POST → GET → DELETE. Make sure the target service (and any backing datastore) is running first.

- **Apps service** (Node + MongoDB):
  ```bash
  ./scripts/api-smoke.sh
  ```
  Override the target with `APPS_API_URL` or `API_URL`:
  ```bash
  APPS_API_URL="https://example.com/api/apps" ./scripts/api-smoke.sh
  ```

- **Services service** (Flask):
  ```bash
  ./scripts/services-smoke.sh
  ```
  Override the target with `SERVICES_API_URL`:
  ```bash
  SERVICES_API_URL="https://example.com/api/services" ./scripts/services-smoke.sh
  ```

- **Dependancies service** (.NET):
  ```bash
  ./scripts/dependancies-smoke.sh
  ```
  Override the target with `DEPENDANCIES_API_URL`:
  ```bash
  DEPENDANCIES_API_URL="https://example.com/api/dependancies" ./scripts/dependancies-smoke.sh
  ```
## Roadmap
Use [GitHub Issues](https://github.com/AndrewHulme/fullstack-pilot/issues) as the living backlog and evaluation checklist.

## What I would do next for production
- Add CI (lint, type-check, tests) plus container builds and image scanning.
- Implement seed data and e2e smoke tests for the React + API flow.
- Harden config: secrets from vault, per-env manifests (Helm/Kustomize), health checks.
- Add auth (JWT) and request logging/metrics for all services.
