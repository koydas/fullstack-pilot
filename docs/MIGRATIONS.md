# Database migrations workflow

This repository now uses versioned migrations for all database-backed backend services.
No service should create or alter schema structures at runtime in application business code.

## Services matrix

- `services/services-service` (Python + PostgreSQL): Alembic
- `services/dependencies-service` (.NET + SQL Server): EF Core Migrations
- `services/apps-service` (Node.js + MongoDB): internal versioned migration runner

---

## Development workflow

### Python (`services-service`)

```bash
cd services/services-service
pip install -r requirements.txt
alembic -c alembic.ini upgrade head
python app.py
```

Create a new migration:

```bash
cd services/services-service
alembic -c alembic.ini revision -m "describe change"
```

### .NET (`dependencies-service`)

```bash
cd services/dependencies-service
dotnet restore
dotnet ef database update
dotnet run
```

Create a new migration:

```bash
cd services/dependencies-service
dotnet ef migrations add <MigrationName>
```

At startup:
- migrations are automatically applied in `Development`
- outside `Development`, set `Database:MigrateOnStartup=true` to apply them automatically
- set `Database:MigrateOnStartup=false` only when migrations are handled as a separate deployment step

### Node.js (`apps-service`)

```bash
cd services/apps-service
npm install
npm run migrate:up
npm run start
```

Create a new migration:

```bash
cd services/apps-service
npm run migrate:create -- <migration-name>
```

At startup:
- migrations run automatically when `NODE_ENV != production`
- in production, set `MONGO_MIGRATE_ON_STARTUP=true` to run them at startup if desired

---

## Production guidance

- Prefer running migrations as an explicit deployment step before rolling out new app versions.
- Keep startup auto-migration as a controlled fallback.
- Ensure one writer executes migrations at a time per service/database.
- Rollback strategy:
  - Alembic: `alembic downgrade <revision>`
  - EF Core: `dotnet ef database update <MigrationName>`
  - apps-service runner: `npm run migrate:down`
