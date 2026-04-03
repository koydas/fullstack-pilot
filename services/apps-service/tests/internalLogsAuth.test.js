import assert from 'node:assert/strict';
import { afterEach, describe, it } from 'node:test';

import { createApp } from '../src/app.js';

const serversToClose = [];

afterEach(async () => {
  await Promise.all(
    serversToClose.splice(0, serversToClose.length).map(
      (server) => new Promise((resolve) => server.close(resolve))
    )
  );
});

async function requestInternalLogs(appOptions = {}, headers = {}) {
  const app = createApp(appOptions);
  const server = app.listen(0);
  serversToClose.push(server);

  await new Promise((resolve) => server.once('listening', resolve));
  const { port } = server.address();

  return fetch(`http://127.0.0.1:${port}/internal/logs/recent`, {
    headers,
  });
}

describe('GET /internal/logs/recent auth', () => {
  it('allows access in non-production when INTERNAL_LOGS_ALLOW_NON_PROD is enabled', async () => {
    const response = await requestInternalLogs({
      nodeEnv: 'development',
      internalLogsAllowNonProd: true,
    });

    assert.equal(response.status, 200);
  });

  it('returns 403 in production when INTERNAL_LOGS_TOKEN is not configured', async () => {
    const response = await requestInternalLogs({
      nodeEnv: 'production',
      internalLogsAllowNonProd: false,
    });
    const body = await response.json();

    assert.equal(response.status, 403);
    assert.equal(body.error, 'forbidden');
    assert.match(body.message, /INTERNAL_LOGS_TOKEN/);
  });

  it('returns 401 in production when token header is missing', async () => {
    const response = await requestInternalLogs({
      nodeEnv: 'production',
      internalLogsToken: 'internal-secret',
      internalLogsAllowNonProd: false,
    });
    const body = await response.json();

    assert.equal(response.status, 401);
    assert.equal(body.error, 'unauthorized');
    assert.match(body.message, /Missing x-internal-token/i);
  });

  it('returns 401 in production when token header is invalid', async () => {
    const response = await requestInternalLogs(
      {
        nodeEnv: 'production',
        internalLogsToken: 'internal-secret',
        internalLogsAllowNonProd: false,
      },
      { 'x-internal-token': 'wrong-token' }
    );
    const body = await response.json();

    assert.equal(response.status, 401);
    assert.equal(body.error, 'unauthorized');
    assert.match(body.message, /Invalid internal token/i);
  });

  it('returns 200 in production when token header is valid', async () => {
    const response = await requestInternalLogs(
      {
        nodeEnv: 'production',
        internalLogsToken: 'internal-secret',
        internalLogsAllowNonProd: false,
      },
      { 'x-internal-token': 'internal-secret' }
    );

    assert.equal(response.status, 200);
  });
});
