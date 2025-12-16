# Dependancies Service

A .NET 8 controller-based API that exposes CRUD operations for projects. Storage is in-memory to simplify local testing.

## Prerequisites
- .NET 8 SDK installed locally.

## Run the service
```bash
cd services/dependancies-service
dotnet restore
dotnet run
```

The API starts on `https://localhost:5001` or `http://localhost:5000` by default. The root page redirects to Swagger so you can explore the routes.

## Endpoints
- `GET /api/dependancies` – list all projects
- `GET /api/dependancies/{id}` – get a project by id
- `POST /api/dependancies` – create a project `{ "name": "Title", "description": "Optional" }`
- `PUT /api/dependancies/{id}` – update an existing project
- `DELETE /api/dependancies/{id}` – delete a project

## Request examples
Create a project:
```bash
curl -X POST http://localhost:5000/api/dependancies \
  -H "Content-Type: application/json" \
  -d '{"name":"New project","description":".NET demo"}'
```

Update a project:
```bash
curl -X PUT http://localhost:5000/api/dependancies/<ID> \
  -H "Content-Type: application/json" \
  -d '{"name":"Updated name","description":"New description"}'
```

Delete a project:
```bash
curl -X DELETE http://localhost:5000/api/dependancies/<ID>
```

## Monitoring

A simple middleware logs each HTTP request with the method, path, status code, and response time. When the service runs via `dotnet run` or Docker Compose, these events appear in the console logs to help track service health.
