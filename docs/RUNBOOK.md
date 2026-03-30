# RUNBOOK

Audience: new teammate inheriting this repo.

## 1) A service is down

1. **Identify which runtime is unhealthy first (don’t guess).**
   - Node API: `curl -s http://localhost:4000/healthz`
   - Python API: `curl -s http://localhost:5000/healthz`
   - If one fails or returns non-`ok`, that is your initial blast radius.
   - Cross-check exposed ports and service names in `docker-compose.yml` before deeper debugging.

2. **Tail logs for the suspect service.**
   - `docker compose logs -f <service>`
   - Common values for `<service>` here: `apps-service`, `services-service`, `dependencies-service`, `client`, `mongo`, `postgres`, `mssql`.

3. **Filter logs for failures.**
   - `docker compose logs <service> | rg -i "error|exception"`
   - Use this to quickly separate noisy startup/info logs from likely root-cause signals.

4. **CI badge vs runtime state: know the difference.**
   - CI badges in `README.md` tell you whether builds/tests passed for a commit in GitHub Actions.
   - Runtime state (your machine, Compose stack, cluster) can still be broken due to env vars, local dependencies, data state, or external systems.
   - Rule: if CI is green but `/healthz` is failing now, treat it as **runtime drift or environment issue**, not proof the code is fine.

## 2) Promoting a change through environments

1. **GitOps flow used in this repo:**
   - code change → PR → merge to `main` → ArgoCD reconciles desired state from Git.
   - This model is documented in `docs/adr/ADR-003-gitops-model.md`.

2. **Manifests ArgoCD watches (under `.gitops/`):**
   - `.gitops/client-application.yaml`
   - `.gitops/apps-service-application.yaml`
   - `.gitops/services-service-application.yaml`
   - `.gitops/dependencies-service-application.yaml`
   - `.gitops/server-application.yaml`

3. **Promotion to staging (branch/PR model).**
   - Typical order here: merge to `dev`, validate, then promote the same commit to `staging` via PR/cherry-pick (as described in `README.md`).
   - Avoid manual, imperative cluster edits; promotions should be visible in Git history.

4. **Drift correction (in this context).**
   - “Drift” = live cluster state no longer matches manifest state in Git.
   - ArgoCD reconciliation pushes runtime back to what is declared in `.gitops/*.yaml`.

## 3) Adding a new service (checklist)

- [ ] Create `services/<name>-service/`.
- [ ] Add `services/<name>-service/Dockerfile`.
- [ ] Wire service into `docker-compose.yml` with:
  - [ ] unique service name
  - [ ] unique host/container port mapping
  - [ ] required `depends_on`/env vars.
- [ ] Add `.gitops/<name>-application.yaml` for ArgoCD.
- [ ] Add a smoke test under `.devops/tests/smoke/` and include it in `.devops/tests/smoke/run-smoke-tests.js`.
- [ ] Register service discovery metadata in `.devops/discover-services.js` expectations (service folder naming and Dockerfile presence).
- [ ] Document endpoints, env vars, and run commands in `README.md`.
- [ ] (Recommended) Add a service-local `README.md` in `services/<name>-service/`.
