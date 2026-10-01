#!/usr/bin/env bash
# Upgrade test for a database image on an existing data volume:
#   1. start <from-image> on a fresh volume and write a probe record,
#   2. stop it and start <to-image> on the same volume,
#   3. check the probe record is still readable.
#
# When the images need a data migration (DB_UPGRADE_MIGRATE_SCRIPT is set and,
# for postgres, the major version changes), step 2 runs
# `<script> <from-image> <to-image> <volume> <new-volume>` and starts
# <to-image> on the new volume instead, so CI checks the documented migration.
#
# Exit codes:
#   0  data readable after the upgrade
#   3  setup failed: <from-image> could not start or store the probe
#   4  <to-image> exited on the existing volume (incompatible data)
#   5  <to-image> kept running but the probe could not be read back
#   6  the migration script failed
#   other  unexpected error (e.g. image pull failure)
#
# Usage: run-db-upgrade-test.sh <mongo|postgres|mssql> <from-image> <to-image>
set -euo pipefail

engine=${1:?engine required (mongo|postgres|mssql)}
from_image=${2:?from-image required}
to_image=${3:?to-image required}
timeout_seconds=${DB_UPGRADE_TIMEOUT:-300}
migrate_script=${DB_UPGRADE_MIGRATE_SCRIPT:-}
mssql_password=${MSSQL_SA_PASSWORD:-YourStrong!Passw0rd}

name="db-upgrade-${engine}-$$"
probe_value="upgrade-probe-ok"

# Mount points and credentials mirror docker-compose.yml.
case "$engine" in
  mongo)
    mount=/data/db
    env_args=()
    ;;
  postgres)
    mount=  # depends on the image, see data_mount
    env_args=(-e POSTGRES_DB=fullstack-pilot -e POSTGRES_USER=fullstack -e POSTGRES_PASSWORD=fullstack)
    ;;
  mssql)
    mount=/var/opt/mssql
    env_args=(-e ACCEPT_EULA=Y -e MSSQL_PID=Developer -e "MSSQL_SA_PASSWORD=${mssql_password}")
    ;;
  *)
    echo "Unknown engine: $engine" >&2
    exit 2
    ;;
esac

cleanup() {
  docker rm -f "$name" >/dev/null 2>&1 || true
  docker volume rm -f "$name" "$name-new" >/dev/null 2>&1 || true
}
trap cleanup EXIT

db_exec() {
  local statement=$1
  case "$engine" in
    mongo)
      docker exec "$name" mongosh --quiet fullstack-pilot --eval "$statement"
      ;;
    postgres)
      # TCP only: the entrypoint's temporary init server listens on the socket only.
      docker exec "$name" psql -h 127.0.0.1 -v ON_ERROR_STOP=1 -U fullstack -d fullstack-pilot -tAc "$statement"
      ;;
    mssql)
      local sqlcmd=/opt/mssql-tools18/bin/sqlcmd
      local tls_args=(-C)
      if ! docker exec "$name" test -x "$sqlcmd"; then
        sqlcmd=/opt/mssql-tools/bin/sqlcmd
        tls_args=()
      fi
      docker exec "$name" "$sqlcmd" "${tls_args[@]}" -S localhost -U sa -P "$mssql_password" -b -h -1 -W \
        -Q "SET NOCOUNT ON; $statement"
      ;;
  esac
}

# Retries a statement until it succeeds (and, if given, prints the expected value).
# Returns 1 on timeout, 2 if the container stopped.
retry_until() {
  local statement=$1 expected=${2:-} deadline=$((SECONDS + timeout_seconds)) output
  while ((SECONDS < deadline)); do
    if [ "$(docker inspect -f '{{.State.Running}}' "$name" 2>/dev/null)" != "true" ]; then
      echo "Container exited:" >&2
      docker logs --tail 50 "$name" >&2 || true
      return 2
    fi
    if output=$(db_exec "$statement" 2>/dev/null); then
      output=$(printf '%s' "$output" | tr -d '[:space:]')
      if [ -z "$expected" ] || [ "$output" = "$expected" ]; then
        return 0
      fi
    fi
    sleep 3
  done
  echo "Timed out after ${timeout_seconds}s (last output: '${output:-}')" >&2
  docker logs --tail 50 "$name" >&2 || true
  return 1
}

# PostgreSQL 18+ images keep data under /var/lib/postgresql/<major>/docker and
# refuse a mount at /var/lib/postgresql/data, so follow the image's VOLUME.
data_mount() {
  if [ -n "$mount" ]; then
    echo "$mount"
  elif [[ $(docker image inspect -f '{{json .Config.Volumes}}' "$1") == *'"/var/lib/postgresql/data"'* ]]; then
    echo /var/lib/postgresql/data
  else
    echo /var/lib/postgresql
  fi
}

pg_major() {
  docker image inspect -f '{{range .Config.Env}}{{println .}}{{end}}' "$1" | sed -n 's/^PG_MAJOR=//p'
}

needs_migration() {
  [ -n "$migrate_script" ] || return 1
  case "$engine" in
    postgres) [ "$(pg_major "$from_image")" != "$(pg_major "$to_image")" ] ;;
    *) return 0 ;;
  esac
}

# start <image> [volume]
start() {
  local volume=${2:-$name}
  docker run -d --name "$name" "${env_args[@]}" -v "$volume:$(data_mount "$1")" "$1" >/dev/null
}

write_probe() {
  case "$engine" in
    mongo)
      retry_until "db.upgrade_probe.updateOne({_id: 'probe'}, {\$set: {v: '$probe_value'}}, {upsert: true})"
      ;;
    postgres)
      retry_until "CREATE TABLE IF NOT EXISTS upgrade_probe (id int PRIMARY KEY, v text);
        INSERT INTO upgrade_probe VALUES (1, '$probe_value') ON CONFLICT (id) DO NOTHING;"
      ;;
    mssql)
      retry_until "IF DB_ID('upgrade_probe') IS NULL CREATE DATABASE upgrade_probe;" &&
        retry_until "IF OBJECT_ID('upgrade_probe.dbo.probe') IS NULL CREATE TABLE upgrade_probe.dbo.probe (v nvarchar(50));
        IF NOT EXISTS (SELECT 1 FROM upgrade_probe.dbo.probe) INSERT upgrade_probe.dbo.probe VALUES ('$probe_value');"
      ;;
  esac
}

read_probe() {
  case "$engine" in
    mongo) retry_until "print(db.upgrade_probe.findOne({_id: 'probe'}).v)" "$probe_value" ;;
    postgres) retry_until "SELECT v FROM upgrade_probe WHERE id = 1" "$probe_value" ;;
    mssql) retry_until "SELECT v FROM upgrade_probe.dbo.probe" "$probe_value" ;;
  esac
}

docker image inspect "$from_image" >/dev/null 2>&1 || docker pull -q "$from_image" >/dev/null
docker image inspect "$to_image" >/dev/null 2>&1 || docker pull -q "$to_image" >/dev/null

echo "::group::[$engine] seed data with $from_image"
start "$from_image"
if ! { write_probe && read_probe; }; then
  echo "[$engine] setup failed: $from_image could not store the probe" >&2
  exit 3
fi
docker stop -t 60 "$name" >/dev/null
docker rm "$name" >/dev/null
echo "::endgroup::"

if needs_migration; then
  echo "::group::[$engine] migrate to a new volume with $migrate_script, then start $to_image"
  if ! "$migrate_script" "$from_image" "$to_image" "$name" "$name-new"; then
    echo "::endgroup::"
    echo "[$engine] migration script failed: $from_image -> $to_image" >&2
    exit 6
  fi
  start "$to_image" "$name-new"
else
  echo "::group::[$engine] restart the same volume with $to_image"
  start "$to_image"
fi
if read_probe; then
  status=0
else
  status=$?
fi
echo "::endgroup::"

if [ "$status" -eq 2 ]; then
  echo "[$engine] $to_image exited on data written by $from_image (incompatible data)" >&2
  exit 4
elif [ "$status" -ne 0 ]; then
  echo "[$engine] $to_image is running but the probe written by $from_image is unreadable" >&2
  exit 5
fi

echo "[$engine] $from_image -> $to_image: data readable after upgrade"
