# Dependancies Service

A .NET 8 controller-based API that exposes CRUD operations for dependancies. Storage uses Microsoft SQL Server so data persists across restarts.

## Prerequisites
- .NET 8 SDK installed locally.

## Run the service
```bash
cd services/dependancies-service
dotnet restore
dotnet run
```

The API starts on `https://localhost:5001` or `http://localhost:5000` by default. The root page redirects to Swagger so you can explore the routes.

### SQL Server

The service expects a `DependanciesDb` connection string. When running locally without Docker, it defaults to `Server=localhost,1433;Database=DependanciesDb;User Id=sa;Password=YourStrong!Passw0rd;TrustServerCertificate=True;`. Override this by setting `ConnectionStrings__DependanciesDb`.

`docker-compose.yml` includes an `mssql` service that exposes SQL Server on port `1433`. Bring the stack up with Docker Compose to start both the database and the API together.

## Endpoints
- `GET /api/dependancies` – list all dependancies
- `GET /api/dependancies/{id}` – get a dependancy by id
- `POST /api/dependancies` – create a dependancy `{ "name": "Name", "description": "Optional" }`
- `PUT /api/dependancies/{id}` – update an existing dependancy
- `DELETE /api/dependancies/{id}` – delete a dependancy

## Request examples
Create a dependancy:
```bash
curl -X POST http://localhost:5000/api/dependancies \
  -H "Content-Type: application/json" \
  -d '{"name":"New dependancy","description":".NET demo"}'
```

Update a dependancy:
```bash
curl -X PUT http://localhost:5000/api/dependancies/<ID> \
  -H "Content-Type: application/json" \
  -d '{"name":"Updated name","description":"New description"}'
```

Delete a dependancy:
```bash
curl -X DELETE http://localhost:5000/api/dependancies/<ID>
```

## Monitoring

A simple middleware logs each HTTP request with the method, path, status code, and response time. When the service runs via `dotnet run` or Docker Compose, these events appear in the console logs to help track service health.
