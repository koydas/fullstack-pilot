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
    end

    Deploy --> Client
    Deploy --> Services

    Client -->|API calls /api/projects| AppsService
    Client -->|CRUD /api/dependancies| DotNetService
    Client -->|CRUD /api| PythonService

    AppsService -->|Project data| Mongo
    DotNetService -->|In-memory storage| DotNetService
    PythonService -->|In-memory CRUD| PythonService

    CI -. optional migrations .-> Mongo
```

The diagram highlights how the React client communicates with independently deployable backend services, with the Node.js apps service persisting project data in MongoDB. CI/CD automates testing, packaging, and deployment of the client and services to a shared runtime environment.
