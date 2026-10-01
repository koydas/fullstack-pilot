#!/usr/bin/env bash
# Copies a PostgreSQL data volume to a new volume for another major version:
# pg_dumpall with <from-image> on <src-volume>, restore with <to-image> into <dst-volume>.
#
# The source volume is only read, so rolling back means pointing back to it.
# <dst-volume> must be empty or not exist yet. Each image's data mount is read
# from its VOLUME declaration (/var/lib/postgresql/data before 18,
# /var/lib/postgresql from 18).
#
# Usage: upgrade-major.sh [from-image] [to-image] [src-volume] [dst-volume]
# Volumes are Docker volume names or absolute host paths (bind mounts).
# Defaults match docker-compose.yml (project "fullstack-pilot") for 16 -> 18.
set -euo pipefail

from_image=${1:-postgres:16}
to_image=${2:-postgres:18}
src_volume=${3:-fullstack-pilot_postgres-data}
dst_volume=${4:-fullstack-pilot_postgres18-data}
pg_user=${POSTGRES_USER:-fullstack}
pg_password=${POSTGRES_PASSWORD:-fullstack}
timeout_seconds=${PG_UPGRADE_TIMEOUT:-120}

src_name="pg-upgrade-src-$$"
dst_name="pg-upgrade-dst-$$"
dump_dir=$(mktemp -d)

cleanup() {
  docker rm -f "$src_name" "$dst_name" >/dev/null 2>&1 || true
  rm -rf "$dump_dir"
}
trap cleanup EXIT

data_mount() {
  local volumes
  volumes=$(docker image inspect -f '{{json .Config.Volumes}}' "$1")
  if [[ $volumes == *'"/var/lib/postgresql/data"'* ]]; then
    echo /var/lib/postgresql/data
  else
    echo /var/lib/postgresql
  fi
}

# TCP only: the entrypoint's temporary init server listens on the socket only.
wait_ready() {
  local name=$1 deadline=$((SECONDS + timeout_seconds))
  until docker exec -e PGPASSWORD="$pg_password" "$name" pg_isready -q -h 127.0.0.1 -U "$pg_user"; do
    if [ "$(docker inspect -f '{{.State.Running}}' "$name" 2>/dev/null)" != "true" ]; then
      docker logs --tail 30 "$name" >&2 || true
      echo "$name exited before accepting connections" >&2
      return 1
    fi
    if ((SECONDS >= deadline)); then
      echo "$name not ready after ${timeout_seconds}s" >&2
      return 1
    fi
    sleep 2
  done
}

docker image inspect "$from_image" >/dev/null 2>&1 || docker pull -q "$from_image" >/dev/null
docker image inspect "$to_image" >/dev/null 2>&1 || docker pull -q "$to_image" >/dev/null

# A volume name, or an absolute host path for a bind mount.
exists() {
  if [[ $1 == /* ]]; then [ -d "$1" ]; else docker volume inspect "$1" >/dev/null 2>&1; fi
}

if ! exists "$src_volume"; then
  echo "Source volume '$src_volume' not found" >&2
  exit 1
fi
if exists "$dst_volume" &&
  [ -n "$(docker run --rm -v "$dst_volume:/dst" --entrypoint ls "$to_image" -A /dst)" ]; then
  echo "Destination volume '$dst_volume' is not empty; remove it or pick another name" >&2
  exit 1
fi

echo "Dumping $src_volume with $from_image"
docker run -d --name "$src_name" -e POSTGRES_PASSWORD="$pg_password" \
  -v "$src_volume:$(data_mount "$from_image")" "$from_image" >/dev/null
wait_ready "$src_name"
docker exec -e PGPASSWORD="$pg_password" "$src_name" pg_dumpall -h 127.0.0.1 -U "$pg_user" >"$dump_dir/dump.sql"
docker stop -t 60 "$src_name" >/dev/null

echo "Restoring into $dst_volume with $to_image"
# POSTGRES_DB=postgres: the dump creates the application databases itself.
docker run -d --name "$dst_name" -e POSTGRES_USER="$pg_user" -e POSTGRES_PASSWORD="$pg_password" \
  -e POSTGRES_DB=postgres -v "$dst_volume:$(data_mount "$to_image")" "$to_image" >/dev/null
wait_ready "$dst_name"
docker cp "$dump_dir/dump.sql" "$dst_name:/tmp/dump.sql"
# The superuser already exists in the new cluster, so its CREATE ROLE is the
# one expected error; anything else fails the upgrade.
docker exec -e PGPASSWORD="$pg_password" "$dst_name" psql -h 127.0.0.1 -U "$pg_user" -d postgres -q -f /tmp/dump.sql \
  >/dev/null 2>"$dump_dir/restore.err" || true
if grep -v "role \"$pg_user\" already exists" "$dump_dir/restore.err" | grep -q 'ERROR'; then
  cat "$dump_dir/restore.err" >&2
  echo "Restore into $dst_volume failed" >&2
  exit 1
fi
docker stop -t 60 "$dst_name" >/dev/null

echo "Done: $src_volume ($from_image) -> $dst_volume ($to_image). $src_volume was not modified."
