# Risk analysis — Python 3.14 → 3.15 (`services-service`)

| | |
|---|---|
| **Change** | [PR #223](https://github.com/koydas/fullstack-pilot/pull/223) — Dependabot, `services/services-service/Dockerfile`: `FROM python:3.14-slim` → `python:3.15-slim` (1 line) |
| **Analysed against** | `main` @ `6ffd167`; PR head `4403c7e` (base `8b93767`, stale) |
| **Date** | 2026-10-22 |
| **Policy** | [ADR-004](adr/ADR-004-latest-dependency-versions.md): latest stable, majors included; CI tests on the Dockerfile runtime |
| **Verdict** | **Low risk — merge once smoke is green on a rebased head.** The only red check is not caused by Python and masks the one path 3.15 has not yet been shown to run. |

## 1. Blast radius

One service, one image. Python version has no coupling to persisted state: the Alembic migrations, the PostgreSQL 18 data volume and the psycopg wire protocol are unchanged by the interpreter. Rollback is reverting the Dockerfile line and rebuilding (no data migration, unlike [ADR-005](adr/ADR-005-database-major-upgrades.md) database bumps).

Python-version-sensitive surface in the service (≈590 lines in `service_api/`, `alembic/`, `tests/`): Flask 3.1, SQLAlchemy 2.1 (Alembic only), psycopg 3.3 + `psycopg_pool`, Alembic 1.20. No `open()`, `locale`, `asyncio`, `distutils`, `pkg_resources` or `datetime.utcnow()` usage (grep).

## 2. Evidence

### Verified

| Claim | Evidence |
|---|---|
| Image builds on 3.15; all pinned-range deps install | `smoke` → *Build and start stack* succeeded; traceback paths show `/usr/local/lib/python3.15/site-packages/…` |
| Unit tests pass on 3.15 | Check `services-service-tests` ✅ (interpreter resolved from the Dockerfile by `.devops/runtime-version.js`) |
| CI/Dockerfile runtime consistency | Check `runtime-versions` ✅ |
| Alembic → SQLAlchemy → psycopg connect to PostgreSQL 18 on 3.15 | Run [39515916756](https://github.com/koydas/fullstack-pilot/actions/runs/39515916756): attempt 1 `Connection refused` (Postgres not ready), then `Serving Flask app 'service_api.factory'`. `start.sh` only `exec`s the app after `alembic upgrade head` succeeds (*inferred from log order*) |
| Flask app boots on 3.15 | Same log: JSON logging formatter active, dev server listening |
| No deprecation/behaviour regressions in the service code | Local, `uv` CPython **3.15.0b4 (beta, not the GA the image ships)**: `python -X dev -W error -m unittest tests/test_routes.py tests/test_factory_startup.py` → 4/4 OK; `import service_api.db, service_api.factory, alembic.config, psycopg_pool` OK with `psycopg-binary` implementation |

### Not verified

| Gap | Why |
|---|---|
| `GET /api/services` through `ConnectionPool` on 3.15 | `smoke` is red **before** reaching `services-service` (see §3). The smoke runner is sequential and fail-fast: `mongo-db` → `apps-service` → `services-service` → … |
| Any write path (`INSERT`/`UPDATE`/`DELETE`) on 3.15 | Not covered by smoke (list only) nor unit tests (`FakeRepository`, `psycopg` never exercised) |
| Behaviour on 3.15 GA vs the 3.15.0b4 used locally | Local env could not pull GA; CI image is GA |
| 3.15 release notes line-by-line | Not re-read in this analysis; coverage here is empirical (§2 verified) plus the grep in §1 |

## 3. The red check is not Python

`smoke` fails at *Run smoke tests* (19 s):

```
→ apps-service [attempt 1..10/10]... failed (fetch failed | cause: read ECONNRESET / other side closed)
fullstack-pilot-mongo   … Restarting
```

`apps-service` (Node, MongoDB) started (`service router registered`) but never answered; the `mongo` container was in a restart loop. `services-service` was `Up` and serving. Root cause of the Mongo restart is **not established** here. Observations: PR base `8b93767` predates current `main`; `main` smoke runs on `6ffd167`, `e8f5c42`, `f1b10af` are green. The failing job is not on the code path changed by this PR.

## 4. Risk register

| # | Risk | Likelihood | Impact | Detection | Mitigation |
|---|---|---|---|---|---|
| R1 | psycopg pool/query path regresses on 3.15 | Low (wheel installs, connection works, no deprecated API in use) | Med: every request fails | **Not yet detected** — smoke blocked | Rebase, re-run smoke; require the `services-service` line to pass |
| R2 | Unit tests give false confidence | Med | Low | — | CI runs `python -m unittest tests/test_routes.py` only: `test_factory_startup.py` is never run, and `psycopg` is only imported, never exercised (repository faked/patched). Run `python -m unittest discover` |
| R3 | Unpinned transitive deps (`requirements.txt` has ranges, no lock) resolve differently on rebuild; slim image has no compiler, so a dep without a `cp315` wheel fails the build | Low–Med | Low (fail-fast at build, not at runtime) | Docker build / CI | Accept, or add a constraints/lock file |
| R4 | Floating `3.15-slim` tag: patch releases and the Debian base move without a PR; CI only resolves `major.minor` | Med | Low–Med | Not detected | Pin by digest as done for DB images (Dependabot proposes digest bumps) |
| R5 | Fresh minor: early patch releases, third-party wheel/CVE ecosystem still settling | Low–Med | Low | Weekly Dependabot | 3.14 stays supported; deferral costs nothing technically. ADR-004 says merge, and records no hold-back justification |
| R6 | Docs drift | Certain | Low | — | `README.md` (Test prerequisites) and `services/services-service/README.md` say "Python 3.10+"; the Dockerfile ships 3.15 and CI tests only that |
| R7 | Unrelated: `start.sh` runs the Flask development server (`app.run`) in the container (WARNING in logs) | n/a | n/a | — | Out of scope of this bump; not worsened by it |

## 5. Recommendation

1. Comment `@dependabot rebase` on #223 (rebuilds on current `main`; also clears the unrelated Mongo/apps-service failure if it was environmental).
2. Merge only if `smoke` is green **including** the `services-service` step, plus the required code-owner review (ADR-004).
3. If `smoke` fails again on `apps-service` with the same ECONNRESET/`mongo Restarting`, treat it as a separate defect on `main`-adjacent infra, not as a Python regression; reproduce `docker compose up` on `main` before blocking the bump.
4. Follow-ups (separate PRs, none blocking): R2 (run all tests), R4 (digest pin), R6 (docs).

## 6. Rollback

Revert the Dockerfile line → rebuild `services-service`. No schema, volume or protocol change to undo.
