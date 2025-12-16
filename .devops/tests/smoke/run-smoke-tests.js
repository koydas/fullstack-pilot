#!/usr/bin/env node
import assert from 'node:assert/strict';
import childProcess from 'node:child_process';
import net from 'node:net';

const retries = Number(process.env.SMOKE_RETRIES || 10);
const retryDelayMs = Number(process.env.SMOKE_RETRY_DELAY_MS || 2000);
const timeoutMs = Number(process.env.SMOKE_TIMEOUT_MS || 5000);

const services = [
  {
    name: 'apps-service',
    run: () =>
      runHttpTest(
        process.env.SMOKE_APPS_SERVICE_URL || 'http://localhost:4000/api/apps',
        (response) =>
          expectJsonArray(response, {
            context: 'apps collection',
          }),
      ),
  },
  {
    name: 'services-service',
    run: () =>
      runHttpTest(
        process.env.SMOKE_SERVICES_SERVICE_URL || 'http://localhost:5000/api/services',
        (response) => expectJsonArray(response, { context: 'services registry' }),
      ),
  },
  {
    name: 'dependancies-service',
    run: () =>
      runHttpTest(
        process.env.SMOKE_DEPENDANCIES_SERVICE_URL || 'http://localhost:6060/api/dependancies',
        (response) =>
          expectJsonArray(response, {
            context: 'dependancies catalogue',
            minLength: 1,
          }),
      ),
  },
  {
    name: 'postgres',
    setup: () => ensurePostgresHelper(process.env.SMOKE_POSTGRES_URL),
    run: () =>
      runPostgresCheck(
        process.env.SMOKE_POSTGRES_URL || 'postgres://fullstack:fullstack@localhost:5432/fullstack-pilot',
      ),
  },
];

async function runHttpTest(url, validate) {
  const response = await fetchWithTimeout(url);
  await validate(response);
}

async function fetchWithTimeout(url) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    return await fetch(url, { signal: controller.signal });
  } catch (error) {
    if (error.name === 'AbortError') {
      throw new Error(`Request to ${url} timed out after ${timeoutMs}ms`);
    }
    throw error;
  } finally {
    clearTimeout(timer);
  }
}

async function runPostgresCheck(connectionString) {
  const target = new URL(connectionString);
  const host = target.hostname || 'localhost';
  const port = Number(target.port) || 5432;

  await new Promise((resolve, reject) => {
    const socket = net.connect({ host, port }, () => {
      socket.end();
      resolve();
    });

    const onError = (error) => {
      socket.destroy();
      reject(new Error(`Unable to reach PostgreSQL at ${host}:${port} (${error.message})`));
    };

    socket.setTimeout(timeoutMs, () => onError(new Error(`timeout after ${timeoutMs}ms`)));
    socket.on('error', onError);
  });
}

async function ensurePostgresHelper(connectionString) {
  if (process.env.SMOKE_POSTGRES_SKIP_AUTOSTART === 'true') {
    return;
  }

  const target = connectionString || 'postgres://fullstack:fullstack@localhost:5432/fullstack-pilot';

  try {
    await runPostgresCheck(target);
    return; // already reachable
  } catch (error) {
    console.warn(`PostgreSQL not reachable yet (${error.message}). Attempting to start helper container...`);
  }

  if (!isDockerAvailable()) {
    console.warn('Docker is not available; skipping PostgreSQL helper auto-start.');
    return;
  }

  const containerName = process.env.SMOKE_POSTGRES_CONTAINER || 'fullstack-pilot-postgres';

  // If the container exists but is stopped, try starting it first.
  if (isContainerPresent(containerName)) {
    try {
      childProcess.execSync(`docker start ${containerName}`, { stdio: 'ignore' });
      return;
    } catch (error) {
      console.warn(`Failed to start existing PostgreSQL container ${containerName}: ${error.message}`);
    }
  }

  try {
    childProcess.execSync('npm run start:postgre', { stdio: 'inherit' });
  } catch (error) {
    console.warn(`Unable to auto-start PostgreSQL helper via npm script: ${error.message}`);
  }
}

function isDockerAvailable() {
  try {
    childProcess.execSync('docker info', { stdio: 'ignore' });
    return true;
  } catch (error) {
    return false;
  }
}

function isContainerPresent(name) {
  try {
    const result = childProcess.execSync(`docker ps -a --filter name=^/${name}$ --format "{{.Names}}"`, {
      encoding: 'utf8',
    });
    return result.trim().length > 0;
  } catch (error) {
    return false;
  }
}

async function expectJsonArray(response, { context, minLength }) {
  assert.ok(response, `No response received for ${context}`);
  assert.ok(
    response.ok,
    `${context} responded with status ${response.status} ${response.statusText}`,
  );

  let payload;
  try {
    payload = await response.json();
  } catch (error) {
    throw new Error(`${context} did not return JSON: ${error.message}`);
  }

  assert.ok(Array.isArray(payload), `${context} did not return a JSON array`);

  if (typeof minLength === 'number') {
    assert.ok(
      payload.length >= minLength,
      `${context} should contain at least ${minLength} entr${minLength === 1 ? 'y' : 'ies'}`,
    );
  }

  return payload;
}

async function runTest({ name, run, setup }) {
  let attempt = 0;
  let lastError;

  if (typeof setup === 'function') {
    await setup();
  }

  while (attempt < retries) {
    attempt += 1;
    try {
      process.stdout.write(`→ ${name} [attempt ${attempt}/${retries}]... `);
      await run();
      console.log('ok');
      return;
    } catch (error) {
      lastError = error;
      console.log('failed');
      if (attempt < retries) {
        await new Promise((resolve) => setTimeout(resolve, retryDelayMs));
      }
    }
  }

  throw new Error(`Smoke test failed for ${name}: ${lastError?.message || 'Unknown error'}`);
}

async function main() {
  for (const service of services) {
    await runTest(service);
  }
  console.log('\nAll smoke tests passed.');
}

main().catch((error) => {
  console.error(`\nSmoke test run failed: ${error.message}`);
  process.exit(1);
});
