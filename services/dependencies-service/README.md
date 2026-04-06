# Dependencies Service

A .NET 8 controller-based API that exposes CRUD operations for dependencies. Storage uses Microsoft SQL Server so data persists across restarts.

## Prerequisites
- .NET 8 SDK installed locally.

## Run the service
```bash
cd services/dependencies-service
dotnet restore
dotnet run
```

The API starts on `https://localhost:5001` or `http://localhost:5000` by default. The root page redirects to Swagger so you can explore the routes.

### SQL Server

The service expects a `DependenciesDb` connection string. When running locally without Docker, it defaults to `Server=localhost,1433;Database=DependenciesDb;User Id=sa;Password=YourStrong!Passw0rd;TrustServerCertificate=True;`. Override this by setting `ConnectionStrings__DependenciesDb`.

`docker-compose.yml` includes an `mssql` service that exposes SQL Server on port `1433`. Bring the stack up with Docker Compose to start both the database and the API together.

## Endpoints
- `GET /api/dependencies` – list dependencies (supports `limit`, `offset`)
- `GET /api/dependencies/{id}` – get a dependancy by id
- `POST /api/dependencies` – create a dependancy `{ "name": "Name", "description": "Optional" }`
- `PUT /api/dependencies/{id}` – update an existing dependancy
- `DELETE /api/dependencies/{id}` – delete a dependancy

## Request examples
Create a dependancy:
```bash
curl -X POST http://localhost:5000/api/dependencies \
  -H "Content-Type: application/json" \
  -d '{"name":"New dependancy","description":".NET demo"}'
```

Update a dependancy:
```bash
curl -X PUT http://localhost:5000/api/dependencies/<ID> \
  -H "Content-Type: application/json" \
  -d '{"name":"Updated name","description":"New description"}'
```

Delete a dependancy:
```bash
curl -X DELETE http://localhost:5000/api/dependencies/<ID>
```

Paginated list example:

```bash
curl "http://localhost:5000/api/dependencies?limit=10&offset=0"
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

## Monitoring

A simple middleware logs each HTTP request with the method, path, status code, and response time. When the service runs via `dotnet run` or Docker Compose, these events appear in the console logs to help track service health.

## Database migrations (EF Core)
Schema changes are versioned with EF Core migrations.
The service uses `Database.Migrate()` during startup in `Development` (or when `Database:MigrateOnStartup=true`).
Set `Database:MigrateOnStartup=false` only if migrations are executed explicitly by your deployment pipeline before service startup.

Apply migrations manually:

```bash
cd services/dependencies-service
dotnet ef database update
```

Create a new migration:

```bash
cd services/dependencies-service
dotnet ef migrations add <MigrationName>
```
