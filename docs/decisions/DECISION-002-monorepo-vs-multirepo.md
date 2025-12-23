# Decision 002: Monorepo Structure

## Context
- The repository contains the client plus multiple backend services and database build contexts under one root.
- Shared scripts (docker-compose, npm tooling) assume code lives together for local orchestration.
- Coordination across services benefits from visible changes in a single pull request.

## Decision
Keep the monorepo layout instead of splitting services into separate repositories.

## Consequences
- **Pros:** Unified CI/CD pipelines; easier cross-service refactors; consistent dependency versions and shared documentation.
- **Cons:** Larger clone size; CI runs can include unrelated services; repository permissions and branch rules must cover diverse stacks.
