---
name: validate-change
description: Map a fullstack-pilot change to the smallest validation that proves it — per area (client, Node, Python, .NET, cross-service, infra/DB) with the matching CI workflow. Use before declaring a change done or pushing.
---

Run only what the diff touches (`AGENTS.md` → Validation Policy); report anything skipped and why.

| Diff touches | Local check | CI workflow |
|---|---|---|
| `client/` | `npm --prefix client test -- --run`; add `npm --prefix client run build` if build-impacting | `build-frontend.yml`, `playwright-e2e.yml` |
| `services/apps-service` (Node) | `npm --prefix services/apps-service test` | `services-unit-tests.yml` |
| `services/services-service` (Python) | `npm run test:services-service` (tests required only when asked; otherwise startup validation) | `services-unit-tests.yml` |
| `services/dependencies-service` (.NET) | `npm run test:dependencies-service`, or minimal build/startup | `services-unit-tests.yml`, `build-backend.yml` |
| Runtime versions, Dockerfiles | `npm run test:consistency` | `consistency-checks.yml` |
| New/renamed service | `npm run test:smoke`; register in `discover-services.js` | `smoke-tests.yml` |
| `databases/` | read ADR-005 + `docs/MIGRATIONS.md` | `db-upgrade-tests.yml`, `postgre-db.yml`, `mongo-db.yml`, `mssql.yml` |
| Cross-service | smallest integration check proving the contract | — |

A cross-service, shared-contract or ambiguous change stops for confirmation before edits (`AGENTS.md` → Scope Rules).
