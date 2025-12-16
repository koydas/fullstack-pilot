# Smoke tests

Quick checks to verify each service responds on its expected port. The tests expect the services to be running locally (for example via `docker compose up`) and rely on the default ports defined in `docker-compose.yml`.

## Running

```bash
npm run test:smoke
```

Environment variables can override the target URLs:

- `SMOKE_APPS_SERVICE_URL` (default: `http://localhost:4000/api/apps`)
- `SMOKE_SERVICES_SERVICE_URL` (default: `http://localhost:5000/api/services`)
- `SMOKE_DEPENDANCIES_SERVICE_URL` (default: `http://localhost:6060/api/dependancies`)
- `SMOKE_POSTGRES_URL` (default: `postgres://fullstack:fullstack@localhost:5432/fullstack-pilot`)
- `SMOKE_POSTGRES_CONTAINER` (default: `fullstack-pilot-postgres`) – container name to reuse when auto-starting
- `SMOKE_POSTGRES_SKIP_AUTOSTART` (set to `true` to disable) – skip attempts to start the local helper container
- `SMOKE_MONGO_URL` (default: `mongodb://localhost:27017/fullstack-pilot`)
- `SMOKE_MONGO_CONTAINER` (default: `fullstack-pilot-mongo`) – container name to reuse when auto-starting
- `SMOKE_MONGO_SKIP_AUTOSTART` (set to `true` to disable) – skip attempts to start the local helper container

Optional tuning variables:

- `SMOKE_RETRIES` (default: `10`) – retry attempts before failing
- `SMOKE_RETRY_DELAY_MS` (default: `2000`) – wait time between retries
- `SMOKE_TIMEOUT_MS` (default: `5000`) – per-request timeout in milliseconds
