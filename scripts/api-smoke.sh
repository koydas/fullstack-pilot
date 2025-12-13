#!/usr/bin/env bash
set -euo pipefail

API_URL=${APPS_API_URL:-${API_URL:-"http://localhost:4000/api/apps"}}

log() {
  echo "[smoke] $1"
}

post_body=$(printf '{"name":"Smoke test %s"}' "$(date +%s)")
log "Creating app at $API_URL"
create_response=$(curl -sS -X POST -H "Content-Type: application/json" -d "$post_body" "$API_URL")

id=$(node -e "const payload = JSON.parse(process.argv[1] || '{}'); if (!payload._id) { process.exit(1); } console.log(payload._id);" "$create_response") || {
  echo "Create response did not include _id: $create_response" >&2
  exit 1
}

log "Created app with id $id"

log "Fetching apps"
list_response=$(curl -sS "$API_URL")

node -e "const id = process.env.ID; const body = JSON.parse(process.argv[1] || '[]'); const found = Array.isArray(body) && body.some((item) => item._id === id); if (!found) { process.exit(1); }" "$list_response" || {
  echo "Created app not found in list response: $list_response" >&2
  exit 1
}

log "Deleting app $id"
# DELETE should return 204
curl -sS -o /dev/null -w "%{http_code}" -X DELETE "$API_URL/$id" | grep -q "^204$" || {
  echo "Delete request failed" >&2
  exit 1
}

log "Smoke test completed successfully"
