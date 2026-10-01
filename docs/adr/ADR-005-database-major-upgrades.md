# Title
ADR-005: Database major upgrades go through a tested data migration

# Status
Accepted

# Context
ADR-004 keeps every dependency on its latest major, including the database images (`databases/*`, `docker-compose.yml`). Unlike libraries, a database major can change the on-disk format: PostgreSQL 18 cannot open a 16 data directory, and SQL Server 2025 upgrades 2022 databases in place with no way back. Bumping the image tag alone either fails to start on existing volumes or upgrades them irreversibly, and the `smoke` tests only start databases on empty volumes, so neither case shows up in CI.

# Decision
A database major upgrade is merged only with a data migration path that CI exercises.

- If the new major cannot open the previous data in place, it runs on a new volume named after the major (for example `postgres18-data`). The previous volume is never mounted by the new image.
- The migration is a versioned script in the database folder (for example `databases/postgre/upgrade-major.sh`, which uses `pg_dumpall` with the old image and restores with the new one). It only reads the source volume, so rollback means restoring the previous image and volume.
- `Database upgrade tests` (`.devops/tests/db-upgrade/`) seeds data with the base branch image, runs the migration script when one is declared for that database, and reads the data back with the new image. Upgrades that work in place are tested on the same volume.
- The procedure is documented in the database README and in `docs/RUNBOOK.md`. The old volume is removed manually once the new one is verified.

# Consequences
Benefits: a major bump cannot reach `main` unless existing data survives it in CI, and every upgrade can be rolled back from untouched data. Costs: a migration script per database engine, a one-time manual step for anyone with local data, disk space for two volumes during the transition, and volume names that change with each major. Dump/restore is slower than `pg_upgrade --link` on large datasets; that is acceptable for the development and CI data this repository manages.
