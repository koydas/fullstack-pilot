# Flask CRUD service

A lightweight Flask API that exposes CRUD operations for simple services. Data is stored in PostgreSQL so it persists across restarts when a database volume is mounted.

## Requirements
- Python 3.10+
- `pip` for installing dependencies
- A running PostgreSQL instance (e.g., via `npm run start:postgre`).

## Setup
Install dependencies in a virtual environment (recommended):

```bash
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

## Running the service
Start the API locally:

```bash
python app.py
```

The service will listen on `http://localhost:5000` by default. To use a different port, set the `PORT` environment variable before starting the app. Configure the database connection string with `POSTGRES_DSN` (defaults to `postgresql://fullstack:fullstack@localhost:5432/fullstack-pilot`).

### Project layout
- `app.py` – WSGI entrypoint that wires a Flask app using the factory in `service_api`.
- `service_api/factory.py` – creates the Flask app instance and registers blueprints.
- `service_api/monitoring.py` – request timing and logging middleware registered in the app factory.
- `service_api/routes.py` – request handlers grouped under the `/api/services` blueprint.
- `service_api/validation.py` – request payload parsing and validation helpers.
- `service_api/db.py` – PostgreSQL-backed persistence for services.

## API
All endpoints are prefixed with `/api`.

- `GET /api/services` — list services (supports `appId`, `limit`, `offset`)
- `POST /api/services` — create a service. JSON body: `{ "name": "Example", "description": "Optional details" }`
- `GET /api/services/<id>` — fetch a single service
- `PUT /api/services/<id>` — update name and/or description
- `DELETE /api/services/<id>` — remove a service

Example request to create a service:

```bash
curl -X POST http://localhost:5000/api/services \
  -H "Content-Type: application/json" \
  -d '{"name": "Write docs", "description": "First draft"}'
```

Example paginated request:

```bash
curl "http://localhost:5000/api/services?appId=default-app&limit=10&offset=0"
```

Response format:

```json
{
  "items": [],
  "total": 0,
  "limit": 10,
  "offset": 0
}
```

## Database migrations (Alembic)
Schema changes are versioned with Alembic migrations and are no longer created/altered at runtime by the Flask app.

Run migrations before starting the API:

```bash
cd services/services-service
alembic -c alembic.ini upgrade head
python app.py
```

Create a new migration:

```bash
cd services/services-service
alembic -c alembic.ini revision -m "describe change"
```
