# FullStack Pilot

A minimal full-stack starter that pairs a React frontend with a Node.js + MongoDB backend. The UI lets you add and remove projects from a list, and the API persists them in a Mongo database.

## Prerequisites
- Node.js 18+
- MongoDB instance (local or remote)

> Tip: If you prefer Docker, a Compose setup is available in `mongo-db/`. Run `cd mongo-db && docker compose up -d` to start a local MongoDB instance at `mongodb://localhost:27017/fullstack-pilot`.

## Project structure
- `client/` – React UI built with Vite.
- `server/` – Express + Mongoose API service.
- `services-service/` – Standalone Flask API with in-memory CRUD endpoints.

## Getting started

### 1) Install dependencies
Run the following commands from the repository root:
```bash
cd server && npm install
cd ../client && npm install
```

> If your environment restricts access to the npm registry, configure the registry your network allows before running the installs.

### 2) Configure environment
Create a `.env` file in `server/` (the server will load it automatically) or export variables in your shell:
```
MONGODB_URI=mongodb://localhost:27017/fullstack-pilot
PORT=4000
```

### 3) Start the backend
```bash
cd server
npm run dev
```
The API will be available at `http://localhost:4000/api`.

### 3b) Start the Flask CRUD service
```bash
cd services-service
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
python app.py
```
The API will be available at `http://localhost:5000/api` by default.

From the repository root you can also start the Flask service with npm:

```bash
npm run start:services-service
```

### 4) Start the frontend
```bash
cd client
npm run dev
```
Open the printed Vite dev server URL (default `http://localhost:5173`). The dev server proxies `/api` requests to the backend.

## API overview
- `GET /api/projects` – list projects
- `POST /api/projects` – create a project. Body: `{ "name": "My project" }`
- `DELETE /api/projects/:id` – delete a project by id

## Deployment notes
- Set `MONGODB_URI` to your managed MongoDB connection string.
- Use `npm run build` inside `client/` to create a production build. Serve the static assets with your preferred host and point them at the running backend.
