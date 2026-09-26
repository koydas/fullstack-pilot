#!/usr/bin/env bash
# Upgrade test for a database image on an existing data volume:
#   1. start <from-image> on a fresh volume and write a probe record,
#   2. stop it and start <to-image> on the same volume,
#   3. check the probe record is still readable.
# Exits non-zero when the new image cannot start on, or read, the old data.
#
# Usage: run-db-upgrade-test.sh <mongo|postgres|mssql> <from-image> <to-image>
set -euo pipefail

engine=${1:?engine required (mongo|postgres|mssql)}
from_image=${2:?from-image required}
to_image=${3:?to-image required}
timeout_seconds=${DB_UPGRADE_TIMEOUT:-300}
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
    mount=/var/lib/postgresql/data
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
  docker volume rm -f "$name" >/dev/null 2>&1 || true
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

# Retries a statement until it succeeds (and, if given, prints the expected value)
# or the container stops / the timeout expires.
retry_until() {
  local statement=$1 expected=${2:-} deadline=$((SECONDS + timeout_seconds)) output
  while ((SECONDS < deadline)); do
    if [ "$(docker inspect -f '{{.State.Running}}' "$name" 2>/dev/null)" != "true" ]; then
      echo "Container exited:" >&2
      docker logs --tail 50 "$name" >&2 || true
      return 1
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

start() {
  docker run -d --name "$name" "${env_args[@]}" -v "$name:$mount" "$1" >/dev/null
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
      retry_until "IF DB_ID('upgrade_probe') IS NULL CREATE DATABASE upgrade_probe;"
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

echo "::group::[$engine] seed data with $from_image"
start "$from_image"
write_probe
read_probe
docker stop -t 60 "$name" >/dev/null
docker rm "$name" >/dev/null
echo "::endgroup::"

echo "::group::[$engine] restart the same volume with $to_image"
start "$to_image"
read_probe
echo "::endgroup::"

echo "[$engine] $from_image -> $to_image: data readable after upgrade"
