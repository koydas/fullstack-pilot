#!/bin/sh
set -e

MIGRATION_RETRIES=${MIGRATION_RETRIES:-20}
MIGRATION_RETRY_DELAY=${MIGRATION_RETRY_DELAY:-2}

attempt=1
while [ "$attempt" -le "$MIGRATION_RETRIES" ]; do
  if alembic -c alembic.ini upgrade head; then
    break
  fi

  if [ "$attempt" -eq "$MIGRATION_RETRIES" ]; then
    echo "[services-service] Failed to apply migrations after ${MIGRATION_RETRIES} attempts." >&2
    exit 1
  fi

  echo "[services-service] Migration attempt ${attempt}/${MIGRATION_RETRIES} failed; retrying in ${MIGRATION_RETRY_DELAY}s..." >&2
  attempt=$((attempt + 1))
  sleep "$MIGRATION_RETRY_DELAY"
done

exec python app.py
