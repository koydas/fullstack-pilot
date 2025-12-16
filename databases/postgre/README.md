# PostgreSQL local runner

A lightweight PostgreSQL setup for local development that mirrors the MongoDB helper in this repo. It builds a simple image and exposes it on the default PostgreSQL port for quick testing.

## Prerequisites
- Docker Desktop or Docker Engine with Compose plugin installed.

## Build the image
From the repository root:

```bash
docker build -t fullstack-pilot-postgres:latest databases/postgre
```

Or reuse the convenience script that builds and starts the container:

```bash
npm run start:postgre
```

## Run PostgreSQL
Launch a container using the freshly built image:

```bash
docker run -d \
  --name fullstack-pilot-postgres \
  -e POSTGRES_DB=fullstack-pilot \
  -e POSTGRES_USER=fullstack \
  -e POSTGRES_PASSWORD=fullstack \
  -p 5432:5432 \
  -v $(pwd)/databases/postgre/data:/var/lib/postgresql/data \
  fullstack-pilot-postgres:latest
```

The instance will listen on `postgres://fullstack:fullstack@localhost:5432/fullstack-pilot`.

Smoke tests include a reachability probe for this PostgreSQL helper. Override the target with `SMOKE_POSTGRES_URL` if needed.

## Stopping the database
```bash
docker stop fullstack-pilot-postgres && docker rm fullstack-pilot-postgres
```

## Data persistence
- Data is stored in `databases/postgre/data` and persists across restarts.
