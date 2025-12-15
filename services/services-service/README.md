# Flask CRUD service

A lightweight Flask API that exposes CRUD operations for simple services. Data is stored in memory within the Flask app for local
testing and resets each time the service restarts.

## Requirements
- Python 3.10+
- `pip` for installing dependencies

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

The service will listen on `http://localhost:5000` by default. To use a different port, set the `PORT` environment variable before starting the app.

### Project layout
- `app.py` – WSGI entrypoint that wires a Flask app using the factory in `service_api`.
- `service_api/factory.py` – creates the Flask app instance and registers blueprints.
- `service_api/monitoring.py` – request timing and logging middleware registered in the app factory.
- `service_api/routes.py` – request handlers grouped under the `/api/services` blueprint.
- `service_api/validation.py` – request payload parsing and validation helpers.

## API
All endpoints are prefixed with `/api`.

- `GET /api/services` — list all services
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
