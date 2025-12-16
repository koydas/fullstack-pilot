#!/usr/bin/env node
import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

const retries = Number(process.env.SMOKE_RETRIES || 10);
const retryDelayMs = Number(process.env.SMOKE_RETRY_DELAY_MS || 2000);
const timeoutMs = Number(process.env.SMOKE_TIMEOUT_MS || 5000);

const execFileAsync = promisify(execFile);

const mssqlContainerName =
  process.env.SMOKE_MSSQL_CONTAINER_NAME || 'fullstack-pilot-mssql';
const mssqlSaPassword = process.env.MSSQL_SA_PASSWORD || 'YourStrong!Passw0rd';

const services = [
  {
    name: 'apps-service',
    target: process.env.SMOKE_APPS_SERVICE_URL || 'http://localhost:4000/api/apps',
    run: async () => {
      const response = await fetchWithTimeout(
        process.env.SMOKE_APPS_SERVICE_URL || 'http://localhost:4000/api/apps',
      );
      await expectJsonArray(response, {
        context: 'apps collection',
      });
    },
  },
  {
    name: 'services-service',
    target:
      process.env.SMOKE_SERVICES_SERVICE_URL ||
      'http://localhost:5000/api/services',
    run: async () => {
      const response = await fetchWithTimeout(
        process.env.SMOKE_SERVICES_SERVICE_URL ||
          'http://localhost:5000/api/services',
      );
      await expectJsonArray(response, { context: 'services registry' });
    },
  },
  {
    name: 'dependancies-service',
    target:
      process.env.SMOKE_DEPENDANCIES_SERVICE_URL ||
      'http://localhost:6060/api/dependancies',
    run: async () => {
      const response = await fetchWithTimeout(
        process.env.SMOKE_DEPENDANCIES_SERVICE_URL ||
          'http://localhost:6060/api/dependancies',
      );
      await expectJsonArray(response, {
        context: 'dependancies catalogue',
        minLength: 1,
      });
    },
  },
  {
    name: 'mssql',
    target: `container ${mssqlContainerName}`,
    run: async () => {
      await expectSqlcmd(mssqlContainerName, mssqlSaPassword);
    },
  },
];

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

async function runTest({ name, target, run }) {
  let attempt = 0;
  let lastError;

  while (attempt < retries) {
    attempt += 1;
    try {
      process.stdout.write(
        `→ ${name} (${target || name}) [attempt ${attempt}/${retries}]... `,
      );
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

async function expectSqlcmd(containerName, password) {
  assert.ok(containerName, 'Container name for MSSQL smoke test is required');

  const args = [
    'exec',
    containerName,
    '/opt/mssql-tools/bin/sqlcmd',
    '-S',
    'localhost',
    '-U',
    'sa',
    '-P',
    password,
    '-Q',
    'SELECT 1',
  ];

  try {
    const { stdout } = await execFileAsync('docker', args, { timeout: timeoutMs });
    assert.match(
      stdout,
      /\b1\b/,
      'MSSQL smoke test query did not return the expected result',
    );
  } catch (error) {
    throw new Error(`MSSQL smoke test failed: ${error.message}`);
  }
}

main().catch((error) => {
  console.error(`\nSmoke test run failed: ${error.message}`);
  process.exit(1);
});
