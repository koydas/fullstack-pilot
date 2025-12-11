# MongoDB local runner

A lightweight MongoDB setup for local development. It uses Docker Compose to start a MongoDB instance that matches the default connection string in this project (`mongodb://localhost:27017/fullstack-pilot`).

## Prerequisites
- Docker Desktop or Docker Engine with Compose plugin installed.

## Usage
From the repository root:

```bash
cd mongo-db
# Start MongoDB in the background
docker compose up -d
```

The database will listen on `mongodb://localhost:27017` with a default database named `fullstack-pilot`.

## Stopping the database
```bash
docker compose down
```

## Data persistence
- Data is stored in `mongo-db/data` and will persist across restarts.
- You can drop `.js` or `.sh` seed scripts into `mongo-db/init/`; Docker will run them on the first container startup.
