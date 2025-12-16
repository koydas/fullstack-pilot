#!/usr/bin/env bash
set -euo pipefail

container_name=${POSTGRES_CONTAINER_NAME:-fullstack-pilot-postgres}

docker rm -f "$container_name" >/dev/null 2>&1 || true
docker build -t fullstack-pilot-postgres:latest .
docker run -d \
  --name "$container_name" \
  -e POSTGRES_DB=fullstack-pilot \
  -e POSTGRES_USER=fullstack \
  -e POSTGRES_PASSWORD=fullstack \
  -p 5432:5432 \
  -v "$(pwd)/data:/var/lib/postgresql/data" \
  fullstack-pilot-postgres:latest
