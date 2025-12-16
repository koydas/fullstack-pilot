# Smoke tests

Quick checks to verify each service responds on its expected port. The tests expect the services to be running locally (for example via `docker compose up`) and rely on the default ports defined in `docker-compose.yml`.

## Running

```bash
npm run test:smoke
```

Environment variables can override the target URLs:

- `SMOKE_APPS_SERVICE_URL` (default: `http://localhost:4000/api/apps`)
- `SMOKE_SERVICES_SERVICE_URL` (default: `http://localhost:5000/api/services`)
- `SMOKE_DEPENDANCIES_SERVICE_URL` (default: `http://localhost:6000/api/dependancies`)

Optional tuning variables:

- `SMOKE_RETRIES` (default: `5`) – retry attempts before failing
- `SMOKE_RETRY_DELAY_MS` (default: `1000`) – wait time between retries
- `SMOKE_TIMEOUT_MS` (default: `3000`) – per-request timeout in milliseconds
