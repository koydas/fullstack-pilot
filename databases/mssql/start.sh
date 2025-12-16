#!/usr/bin/env bash
set -euo pipefail

container_name=${MSSQL_CONTAINER_NAME:-fullstack-pilot-mssql}
sa_password=${MSSQL_SA_PASSWORD:-YourStrong!Passw0rd}

docker rm -f "$container_name" >/dev/null 2>&1 || true
docker build -t fullstack-pilot-mssql:latest .
docker run -d \
  --name "$container_name" \
  -e ACCEPT_EULA=Y \
  -e MSSQL_PID=Developer \
  -e MSSQL_SA_PASSWORD="$sa_password" \
  -p 1433:1433 \
  -v "$(pwd)/data:/var/opt/mssql" \
  fullstack-pilot-mssql:latest
