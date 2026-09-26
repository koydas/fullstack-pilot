import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { describe, it } from 'node:test';

import { resolveRuntimeVersion } from '../../runtime-version.js';

const repoRoot = path.resolve(import.meta.dirname, '../../..');
const workflowsDir = path.join(repoRoot, '.github/workflows');

// Every CI job that tests a service must run on the runtime of the image that ships.
const SERVICE_TEST_JOBS = [
  { workflow: 'build-frontend.yml', job: 'build', dockerfile: 'client/Dockerfile', runtime: 'node' },
  { workflow: 'services-unit-tests.yml', job: 'apps-service-tests', dockerfile: 'services/apps-service/Dockerfile', runtime: 'node' },
  { workflow: 'services-unit-tests.yml', job: 'agent-service-tests', dockerfile: 'services/agent-service/Dockerfile', runtime: 'node' },
  { workflow: 'services-unit-tests.yml', job: 'services-service-tests', dockerfile: 'services/services-service/Dockerfile', runtime: 'python' },
  { workflow: 'services-unit-tests.yml', job: 'dependencies-service-build', dockerfile: 'services/dependencies-service/Dockerfile', runtime: 'dotnet' },
];

// Jobs whose runtime only drives the test harness, not a shipped service.
const HARNESS_JOBS = new Set([
  'smoke-tests.yml:smoke',
  'playwright-e2e.yml:test',
  'consistency-checks.yml:runtime-versions',
]);

const SETUP_KEYS = { node: 'node-version', python: 'python-version', dotnet: 'dotnet-version' };

function readJobs(workflowFile) {
  const lines = fs.readFileSync(path.join(workflowsDir, workflowFile), 'utf8').split('\n');
  const jobs = {};
  let inJobs = false;
  let current = null;

  for (const line of lines) {
    if (/^jobs:\s*$/.test(line)) {
      inJobs = true;
      continue;
    }
    if (!inJobs) continue;
    if (/^\S/.test(line)) break;

    const jobHeader = line.match(/^ {2}([\w-]+):\s*$/);
    if (jobHeader) {
      current = jobHeader[1];
      jobs[current] = '';
    } else if (current) {
      jobs[current] += `${line}\n`;
    }
  }

  return jobs;
}

describe('resolveRuntimeVersion', () => {
  it('reads the major Node.js version from the first node stage', () => {
    const dockerfile = 'FROM node:26-alpine AS build\nRUN npm ci\nFROM nginx:1.29-alpine\n';
    assert.equal(resolveRuntimeVersion(dockerfile, 'node'), '26');
  });

  it('reads the Python minor version', () => {
    assert.equal(resolveRuntimeVersion('FROM python:3.11-slim\n', 'python'), '3.11');
  });

  it('maps the .NET SDK image tag to a setup-dotnet version', () => {
    assert.equal(resolveRuntimeVersion('FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build\n', 'dotnet'), '8.0.x');
  });

  it('fails when the Dockerfile has no matching base image', () => {
    assert.throws(() => resolveRuntimeVersion('FROM nginx:1.29-alpine\n', 'node'), /No "node" base image/);
  });
});

describe('CI runtime matches the shipped Docker image', () => {
  for (const { workflow, job, dockerfile, runtime } of SERVICE_TEST_JOBS) {
    it(`${workflow}:${job} resolves ${runtime} from ${dockerfile}`, () => {
      const version = resolveRuntimeVersion(fs.readFileSync(path.join(repoRoot, dockerfile), 'utf8'), runtime);
      assert.ok(version, `no ${runtime} version in ${dockerfile}`);

      const jobBody = readJobs(workflow)[job];
      assert.ok(jobBody, `job "${job}" not found in ${workflow}`);
      assert.ok(
        jobBody.includes(`node .devops/runtime-version.js ${dockerfile} ${runtime}`),
        `${workflow}:${job} must resolve its ${runtime} version from ${dockerfile}`
      );
      assert.ok(
        jobBody.includes(`${SETUP_KEYS[runtime]}: \${{ steps.runtime.outputs.version }}`),
        `${workflow}:${job} must set ${SETUP_KEYS[runtime]} from steps.runtime.outputs.version`
      );
    });
  }

  it('no other job hard-codes a runtime version', () => {
    const covered = new Set(SERVICE_TEST_JOBS.map(({ workflow, job }) => `${workflow}:${job}`));
    const offenders = [];

    for (const workflow of fs.readdirSync(workflowsDir).filter((file) => /\.ya?ml$/.test(file))) {
      for (const [job, body] of Object.entries(readJobs(workflow))) {
        const key = `${workflow}:${job}`;
        if (covered.has(key) || HARNESS_JOBS.has(key)) continue;

        const hardCoded = body.match(/^\s+(node|python|dotnet)-version:\s*(?!\$\{\{).+$/m);
        if (hardCoded) offenders.push(`${key} -> ${hardCoded[0].trim()}`);
      }
    }

    assert.deepEqual(
      offenders,
      [],
      'Jobs testing a service must read the runtime from its Dockerfile (.devops/runtime-version.js). ' +
        'If the job only runs a test harness, add it to HARNESS_JOBS.'
    );
  });
});
