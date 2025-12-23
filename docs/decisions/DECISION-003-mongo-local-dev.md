# Decision 003: MongoDB for Local Development

## Context
- The Node.js apps service relies on MongoDB for project data and is wired to `mongodb://mongo:27017/fullstack-pilot` in docker-compose.
- A local Mongo image is built from `databases/mongo-db` and seeded via environment variables.
- Developers need a consistent, disposable database without manual setup.

## Decision
Standardize on the docker-compose MongoDB instance for local development instead of external or shared databases.

## Consequences
- **Pros:** One-command startup with predictable credentials; data isolation per developer; aligns with service defaults.
- **Cons:** Requires Docker runtime; data resets when volumes are removed; production-like tuning (sharding, auth) is not mirrored locally.
