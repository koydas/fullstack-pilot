# AGENT.md

## Mission
- This repository hosts a full-stack system (React frontend + Node/Python/.NET backend services + Docker orchestration).
- Optimize for minimal diffs, correctness, and consistency with existing architecture and patterns.

## Scope Rules
- Modify only files directly required by the task.
- Do not refactor or reformat unrelated code.
- Do not introduce new patterns, abstractions, or dependencies unless strictly required to satisfy the request.
- Keep cross-service changes minimal and justified by an explicit end-to-end requirement.
- Before making any edit, list the impacted files and intended changes.
- Stop and request confirmation before proceeding when:
  - the change spans multiple services or infra areas,
  - shared/core logic or contracts are affected,
  - requirements or acceptance criteria are ambiguous.

## Exploration Strategy
- Read in this order:
  1. `README.md`
  2. `docs/ARCHITECTURE.md`
  3. `docs/adr/` (start with index/README, then only relevant ADRs)
  4. relevant service README (`client/README.md`, `services/README.md`, or service-local docs)
- Locate impacted code via targeted navigation only:
  - import chains,
  - route/controller/handler wiring,
  - service entrypoints and module boundaries.
- Use focused file discovery (`rg` with path filters); do not scan the entire repository.
- Open only files required to implement and validate the scoped change.

## Execution Workflow (MANDATORY)
1. Analyze the request and extract explicit acceptance criteria.
2. Identify only the impacted components and files.
3. Propose a minimal implementation plan.
4. WAIT for confirmation when the change is non-trivial or cross-boundary.
5. Implement scoped changes only.
6. Run targeted validation for touched areas.
7. Summarize:
   - what changed,
   - risks and tradeoffs,
   - remaining gaps or follow-ups.

## Validation Policy
- Frontend changes:
  - `npm --prefix client test -- --run`
  - `npm --prefix client run build` (if build-impacting)
- Node service changes:
  - `npm --prefix services/apps-service test`
- Python service changes:
  - run service/startup validation only unless tests are explicitly required
- .NET service changes:
  - run minimal build/startup validation
- Cross-service changes:
  - run the smallest integration check proving contract compatibility
- Prefer targeted checks over full-suite execution.

## Architecture Constraints
- Respect strict service boundaries between frontend, Node API, Python API, and .NET API.
- Do not create tight coupling across services (shared internals, implicit cross-service dependencies).
- Reuse existing patterns (routing, handlers, data access, config) before introducing alternatives.
- Keep data flow and contracts consistent with current architecture/ADR decisions.

## Quality Rules
- Minimal diff first; avoid broad rewrites.
- Eliminate duplication only within task scope.
- No speculative refactors or “while here” changes.
- Prioritize readability and maintainability over clever implementations.

## Failure Handling
- If requirements are unclear, apply the simplest valid solution and state assumptions explicitly.
- If context is missing, state what is missing and what decision was made with available information.
- If validation cannot run, report exactly what was skipped and why.

## High-Signal Commands

### Setup
- `npm run init`

### Frontend
- `npm run start:client`
- `npm --prefix client test -- --run`
- `npm --prefix client run build`

### Node service
- `npm run start:apps-service`
- `npm --prefix services/apps-service test`

### Python service
- `npm run start:services-service`

### .NET service
- `npm run start:dependencies-service`

### Docker
- `docker compose up --build`
- `docker compose down`
