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

The script removes any stopped `fullstack-pilot-postgres` container before launching a fresh instance to avoid name conflicts.

## Run PostgreSQL
Launch a container using the freshly built image:

```bash
docker run -d \
  --name fullstack-pilot-postgres \
  -e POSTGRES_DB=fullstack-pilot \
  -e POSTGRES_USER=fullstack \
  -e POSTGRES_PASSWORD=fullstack \
  -p 5432:5432 \
  -v $(pwd)/databases/postgre/pgdata:/var/lib/postgresql \
  fullstack-pilot-postgres:latest
```

The instance will listen on `postgres://fullstack:fullstack@localhost:5432/fullstack-pilot`.
Smoke tests will attempt to auto-start this helper (unless `SMOKE_POSTGRES_SKIP_AUTOSTART=true`), so Docker must be available.

Smoke tests include a reachability probe for this PostgreSQL helper. Override the target with `SMOKE_POSTGRES_URL` if needed.

## Stopping the database
```bash
docker stop fullstack-pilot-postgres && docker rm fullstack-pilot-postgres
```

## Data persistence
- Data is stored in `databases/postgre/pgdata` (the `postgres18-data` volume with the root `docker-compose.yml`) and persists across restarts.
- From PostgreSQL 18 the image keeps data under `/var/lib/postgresql/<major>/docker` and refuses to start with a mount at `/var/lib/postgresql/data`, so the mount is `/var/lib/postgresql`.

## Upgrading from PostgreSQL 16
A PostgreSQL 18 server cannot open a 16 data directory, so 18 starts on a new volume (`postgres18-data`) and the old one (`postgres-data`, or `databases/postgre/data`) is left as is. To keep existing data, copy it once with `upgrade-major.sh` (`pg_dumpall` with the old image, restore with the new one; see ADR-005):

```bash
docker compose stop postgres
databases/postgre/upgrade-major.sh            # postgres:16 -> postgres:18, fullstack-pilot_postgres-data -> fullstack-pilot_postgres18-data
docker compose up -d postgres
```

Arguments (all optional): `upgrade-major.sh [from-image] [to-image] [src-volume] [dst-volume]`. The source and destination can also be absolute host paths, e.g. `"$(pwd)/databases/postgre/data"` and `"$(pwd)/databases/postgre/pgdata"` for the local runner. `POSTGRES_USER` / `POSTGRES_PASSWORD` default to `fullstack`. The destination must be empty; the source is never modified, so rolling back means going back to the previous image and volume. Once the new volume is verified, the old one can be removed with `docker volume rm fullstack-pilot_postgres-data`.
