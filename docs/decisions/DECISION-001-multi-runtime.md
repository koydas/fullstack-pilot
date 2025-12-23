# Decision 001: Multi-runtime Services

## Context
- The platform combines a React client, a Node.js apps service, a .NET dependencies service, and a Python CRUD service.
- Each stack connects to a database aligned with its ecosystem through docker-compose.
- Teams contribute in multiple languages and want to keep using the best-fit runtime per domain.

## Decision
Maintain a polyglot service layer instead of converging on a single runtime.

## Consequences
- **Pros:** Teams can use familiar tooling; services can adopt ecosystem-specific libraries; runtime-specific databases stay close to their services.
- **Cons:** Operational surface area grows; onboarding requires cross-stack knowledge; shared patterns (logging, auth) need extra alignment.
