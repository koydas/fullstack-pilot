# Local database helpers

This folder provides quick-start Docker helpers for the databases used in the project. Each subdirectory contains a minimal image definition, a Docker Compose file, and usage notes tailored to that engine.

## Available databases
- **PostgreSQL** (`databases/postgre`): Build a Postgres image and run it on port 5432 for local development.
- **MongoDB** (`databases/mongo-db`): Launch MongoDB on port 27017 with optional init scripts for seeding.
- **Microsoft SQL Server** (`databases/mssql`): Start SQL Server on port 1433 via Compose or the published GHCR image.

## Quick start
From the repository root, use the provided npm scripts to start the supported databases with Docker:

```bash
npm run start:postgre   # Build and run PostgreSQL
npm run start:mongo-db  # Start MongoDB via Docker Compose
```

For SQL Server, switch to the helper directory and start Compose (override `IMAGE_NAMESPACE` if using your own registry):

```bash
cd databases/mssql
IMAGE_NAMESPACE=<OWNER> docker compose up -d
```

All helpers store their data under their respective `data/` folders so containers can be restarted without losing state.
