# MongoDB local runner

A lightweight MongoDB setup for local development. It uses Docker Compose to start a MongoDB instance that matches the default connection string in this project (`mongodb://localhost:27017/fullstack-pilot`).

## Prerequisites
- Docker Desktop or Docker Engine with Compose plugin installed.

## Use the packaged image
The GitHub Actions workflow `Package MongoDB image` (in `.github/workflows/mongo-db.yml`) builds a self-contained Docker image and uploads it as an artifact named `mongo-db-docker-package`.

1. Trigger the workflow (`Run workflow` button) or wait for a push on `main` that touches `databases/mongo-db/**`.
2. Download the `mongo-db-docker-package` artifact, which contains:
   - `mongo-db-image.tar.gz`: the prebuilt MongoDB image
   - `mongo-db-compose.yml`: a Compose file that points to that image
3. Load the image locally:

```bash
gunzip -c mongo-db-image.tar.gz | docker load
```

4. Start MongoDB with Compose:

```bash
docker compose -f mongo-db-compose.yml up -d
```

The database will listen on `mongodb://localhost:27017` with a default database named `fullstack-pilot`.

## Build locally instead of using the artifact
If you prefer to build the image locally, run from the repository root:

```bash
docker build -t fullstack-pilot-mongo:latest databases/mongo-db
cd databases/mongo-db
docker compose up -d
```

## Stopping the database
```bash
docker compose down
```

## Data persistence
- Data is stored in `databases/mongo-db/data` and will persist across restarts.
- You can drop `.js` or `.sh` seed scripts into `databases/mongo-db/init/`; Docker will run them on the first container startup.
