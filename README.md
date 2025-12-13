# FullStack Pilot

A minimal full-stack starter that pairs a React frontend with a Node.js + MongoDB backend. The UI lets you add and remove projects from a list, and the API persists them in a Mongo database.

## Prerequisites
- Node.js 18+
- MongoDB instance (local or remote)

> Tip: If you prefer Docker, a Compose setup is available in `mongo-db/`. Run `cd mongo-db && docker compose up -d` to start a local MongoDB instance at `mongodb://localhost:27017/fullstack-pilot`.

## Project structure
- `client/` – React UI built with Vite.
- `server/` – Express + Mongoose API service.
- `dependancies-service/` – .NET 8 Web API (contrôleurs) exposant des endpoints CRUD avec stockage en mémoire.

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

### Optional: run the .NET CRUD service
```bash
cd dependancies-service
dotnet restore
dotnet run
```
Or start it from the repo root with the provided npm script:
```bash
npm run start:dependancies-service
```
It exposes `/api/projects` routes backed by an in-memory repository (see `dependancies-service/README.md`).

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
