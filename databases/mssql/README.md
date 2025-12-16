# SQL Server local runner

A lightweight Microsoft SQL Server setup for local development. It mirrors the Postgres and MongoDB helpers under `databases/` but targets MSSQL instead.

## Prerequisites
- Docker Desktop or Docker Engine with the Compose plugin installed.

## Use the published image
A GitHub Actions workflow builds, tests, and publishes the image to GitHub Container Registry (GHCR) whenever changes land on `main`. Replace `<OWNER>` with the GitHub org or user that owns this repository (for example, `koydas`):

```bash
docker pull ghcr.io/<OWNER>/fullstack-pilot-mssql:latest
```

To run it with Docker Compose using the published image (override `IMAGE_NAMESPACE` to match your GitHub org/user if different):

```bash
cd databases/mssql
IMAGE_NAMESPACE=<OWNER> docker compose up -d
```

The Compose file expects the image to be available locally (either pulled from GHCR or built yourself) and starts SQL Server on `localhost:1433` with the `sa` user. Set `MSSQL_SA_PASSWORD` in your environment if you want a different password; otherwise it defaults to `YourStrong!Passw0rd`.

## Build the image locally
If you prefer to build locally, run from the repository root:

```bash
docker build -t fullstack-pilot-mssql:latest databases/mssql
```

Then start it with Compose:

```bash
cd databases/mssql
docker compose up -d
```

## Run the container without Compose
You can also start it directly with `docker run`:

```bash
docker run -d \
  --name fullstack-pilot-mssql \
  -e ACCEPT_EULA=Y \
  -e MSSQL_PID=Developer \
  -e MSSQL_SA_PASSWORD=YourStrong!Passw0rd \
  -p 1433:1433 \
  -v $(pwd)/databases/mssql/data:/var/opt/mssql \
  fullstack-pilot-mssql:latest
```

## Smoke test
After the container is running, verify it responds to queries:

```bash
databases/mssql/smoke-test.sh
```

The script expects the container to be named `fullstack-pilot-mssql` and uses `MSSQL_SA_PASSWORD` for authentication.

## Stop the database
```bash
docker compose down
```

## Data persistence
- Data is stored in `databases/mssql/data` and persists across restarts.
- Update `MSSQL_SA_PASSWORD` if you want a different password for the `sa` user.
