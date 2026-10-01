# Database upgrade tests

Checks that a new database image can start on, and read, data written by the previous image. The `smoke` tests only cover empty volumes, so a major version that cannot open existing data (for example a PostgreSQL major) would otherwise pass CI and fail on a real deployment.

CI runs this on pull requests touching `databases/**` or `docker-compose.yml` (`.github/workflows/db-upgrade-tests.yml`), comparing the base branch image with the PR image. A self-test also checks that `postgres:16` → `postgres:17` on the same volume is reported as incompatible data (exit code `4`), so the harness cannot pass on an unrelated failure.

## Running locally

Requires Docker.

```bash
.devops/tests/db-upgrade/run-db-upgrade-test.sh <mongo|postgres|mssql> <from-image> <to-image>

# e.g.
.devops/tests/db-upgrade/run-db-upgrade-test.sh mongo mongo:7 mongo:8
```

Optional variables:

- `DB_UPGRADE_TIMEOUT` (default: `300`) – seconds to wait for each start and query
- `MSSQL_SA_PASSWORD` (default: `YourStrong!Passw0rd`) – SA password for the `mssql` engine

Exit codes: `0` upgrade OK, `3` the old image could not store the probe (setup), `4` the new image exits on the existing data, `5` the new image runs but cannot read the probe.

## Limits

A passing test means the new image starts and reads the old data. It does not tell whether the upgrade is reversible (for example SQL Server 2022 → 2025 upgrades databases in place, with no downgrade path): back up before rolling such an upgrade out.
