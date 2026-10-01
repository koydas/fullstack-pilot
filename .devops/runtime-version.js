#!/usr/bin/env node

// Prints the runtime version a service Dockerfile builds on, in the format
// expected by the matching actions/setup-* step. CI test jobs use it so they
// always test on the runtime that ships (see docs/adr/ADR-004).

import fs from 'fs';

const PATTERNS = {
  // FROM node:26-alpine -> 26
  node: { regex: /^FROM\s+node:(\d+)/im, format: (m) => m[1] },
  // FROM python:3.11-slim -> 3.11
  python: { regex: /^FROM\s+python:(\d+\.\d+)/im, format: (m) => m[1] },
  // FROM mcr.microsoft.com/dotnet/sdk:8.0 -> 8.0.x
  dotnet: { regex: /^FROM\s+mcr\.microsoft\.com\/dotnet\/sdk:(\d+\.\d+)/im, format: (m) => `${m[1]}.x` },
};

export function resolveRuntimeVersion(dockerfileContent, runtime) {
  const pattern = PATTERNS[runtime];
  if (!pattern) {
    throw new Error(`Unknown runtime "${runtime}". Expected one of: ${Object.keys(PATTERNS).join(', ')}.`);
  }

  const match = dockerfileContent.match(pattern.regex);
  if (!match) {
    throw new Error(`No "${runtime}" base image found in Dockerfile.`);
  }

  return pattern.format(match);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const [dockerfilePath, runtime] = process.argv.slice(2);

  if (!dockerfilePath || !runtime) {
    console.error('Usage: runtime-version.js <dockerfile> <node|python|dotnet>');
    process.exit(1);
  }

  try {
    console.log(resolveRuntimeVersion(fs.readFileSync(dockerfilePath, 'utf8'), runtime));
  } catch (error) {
    console.error(`${dockerfilePath}: ${error.message}`);
    process.exit(1);
  }
}
