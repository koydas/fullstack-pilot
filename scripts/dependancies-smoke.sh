#!/usr/bin/env bash
set -euo pipefail

API_URL=${DEPENDANCIES_API_URL:-"http://localhost:5000/api/dependancies"}

log() {
  echo "[dependancies-smoke] $1"
}

post_body=$(printf '{"name":"Smoke dependancy %s","description":"Health check"}' "$(date +%s)")
log "Creating project at $API_URL"
create_response=$(curl -sS -X POST -H "Content-Type: application/json" -d "$post_body" "$API_URL")

id=$(node -e "const payload = JSON.parse(process.argv[1] || '{}'); const id = payload.id ?? payload.Id; if (!id) process.exit(1); console.log(id);" "$create_response") || {
  echo "Create response did not include id: $create_response" >&2
  exit 1
}

log "Created project with id $id"

log "Fetching projects"
list_response=$(curl -sS "$API_URL")

node -e "const id = process.env.ID; const body = JSON.parse(process.argv[1] || '[]'); const found = Array.isArray(body) && body.some((item) => String(item.id ?? item.Id) === String(id)); if (!found) process.exit(1);" "$list_response" || {
  echo "Created project not found in list response: $list_response" >&2
  exit 1
}

log "Deleting project $id"
curl -sS -o /dev/null -w "%{http_code}" -X DELETE "$API_URL/$id" | grep -q "^204$" || {
  echo "Delete request failed" >&2
  exit 1
}

log "Dependancies smoke test completed successfully"
