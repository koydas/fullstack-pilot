#!/usr/bin/env bash
set -euo pipefail

CONTAINER_NAME=${CONTAINER_NAME:-fullstack-pilot-mssql}
SA_PASSWORD=${MSSQL_SA_PASSWORD:-YourStrong!Passw0rd}
SQLCMD=/opt/mssql-tools/bin/sqlcmd

if ! docker inspect "$CONTAINER_NAME" >/dev/null 2>&1; then
  echo "Container '$CONTAINER_NAME' is not running or does not exist." >&2
  exit 1
fi

docker exec "$CONTAINER_NAME" "$SQLCMD" -S localhost -U sa -P "$SA_PASSWORD" -Q "SELECT @@VERSION" >/dev/null

echo "MSSQL smoke test passed: able to query @@VERSION."
