#!/usr/bin/env bash
set -eo pipefail

output_file="$1"
base_sha="$2"
head_sha="$3"
services_dir="${4:-services}"
workflow_path="${5:-.github/workflows/build-backend.yml}"

if [ -z "$output_file" ]; then
  echo "Usage: $0 <output-file> [base-sha] [head-sha] [services-dir] [workflow-path]" >&2
  exit 1
fi

if [ ! -d "$services_dir" ]; then
  echo "No services directory found."
  printf 'services=%s\n' '[]' >> "$output_file"
  exit 0
fi

if [ -z "$head_sha" ]; then
  echo "Missing HEAD sha; defaulting to build all services."
  base_sha=""
fi

if [ -n "$base_sha" ]; then
  git fetch --no-tags --prune --depth=1 origin "$base_sha" || true
fi

workflow_changed=0
if [ -n "$base_sha" ] && [ -n "$head_sha" ]; then
  if git diff --name-only "$base_sha" "$head_sha" -- "$workflow_path" | grep -q .; then
    workflow_changed=1
  fi
fi

services=$(node - <<'NODE'
const fs = require('fs');
const path = require('path');
const base = process.argv[2] || 'services';
const abs = path.resolve(base);
if (!fs.existsSync(abs)) {
  console.log('[]');
  process.exit(0);
}
const result = fs
  .readdirSync(abs, { withFileTypes: true })
  .filter((entry) => entry.isDirectory())
  .filter((entry) => fs.existsSync(path.join(abs, entry.name, 'Dockerfile')))
  .filter((entry) => fs.existsSync(path.join(abs, entry.name, 'package.json')))
  .map((entry) => entry.name);
console.log(JSON.stringify(result));
NODE
"$services_dir"
)

changed_services=()

if [ -z "$base_sha" ] || [ "$workflow_changed" -eq 1 ]; then
  while IFS= read -r service; do
    [ -z "$service" ] && continue
    changed_services+=("$service")
  done <<<"$(echo "$services" | jq -r '.[]')"
else
  while IFS= read -r service; do
    [ -z "$service" ] && continue
    if git diff --name-only "$base_sha" "$head_sha" -- "$services_dir/$service" | grep -q .; then
      changed_services+=("$service")
    fi
  done <<<"$(echo "$services" | jq -r '.[]')"
fi

if [ ${#changed_services[@]} -eq 0 ]; then
  echo "No services changed; nothing to build."
  printf 'services=%s\n' '[]' >> "$output_file"
  exit 0
fi

matrix=$(printf '%s\n' "${changed_services[@]}" | jq -R . | jq -s .)
echo "Services to build: $matrix"
printf 'services=%s\n' "$matrix" >> "$output_file"
