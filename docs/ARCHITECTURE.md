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
    DotNetService -->|Dependencies data| Mongo
    PythonService -->|CRUD data| Mongo

    CI -. optional migrations .-> Mongo
```

The diagram highlights how the React client communicates with independently deployable backend services. Each service now persists its domain data in MongoDB, providing consistent durability across the stack. CI/CD automates testing, packaging, and deployment of the client and services to a shared runtime environment.
