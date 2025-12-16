# Architecture Overview

```mermaid
flowchart TD
    Developer((Source)) --> CI[CI/CD Pipeline]
    CI --> Tests[Unit/Integration Tests]
    Tests --> Build[Build & Package]
    Build --> Registry[(Artifact Registry)]
    Registry --> Deploy[Deploy to Runtime]

    subgraph Runtime
        Client[React Client]
        subgraph Services
            AppsService["Apps Service\n(Node.js)"]
            DotNetService["Dependencies Service\n(.NET)"]
            PythonService["CRUD Service\n(Python Flask)"]
        end
        Mongo[(MongoDB)]
        Postgres[(PostgreSQL)]
        MSSQL[(SQL Server)]
    end

    Deploy --> Client
    Deploy --> Services

    Client -->|API calls /api/projects| AppsService
    Client -->|CRUD /api/dependancies| DotNetService
    Client -->|CRUD /api| PythonService

    AppsService -->|Project data| Mongo
    DotNetService -->|Dependencies data| MSSQL
    PythonService -->|CRUD data| Postgres

    CI -. optional migrations .-> Mongo
    CI -. optional migrations .-> MSSQL
    CI -. optional migrations .-> Postgres
```

The diagram highlights how the React client communicates with independently deployable backend services. Each service persists its domain data in a database engine aligned with its stack (MongoDB for the Node.js service, SQL Server for the .NET service, and PostgreSQL for the Python service), providing durable storage while keeping services decoupled. CI/CD automates testing, packaging, and deployment of the client and services to a shared runtime environment.
