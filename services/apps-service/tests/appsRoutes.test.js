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

async function postApps(init = {}) {
  const app = createApp({});
  const server = app.listen(0);
  serversToClose.push(server);

  await new Promise((resolve) => server.once('listening', resolve));
  const { port } = server.address();

  return fetch(`http://127.0.0.1:${port}/api/apps`, { method: 'POST', ...init });
}

describe('POST /api/apps validation', () => {
  it('returns 400 when the request has no body', async () => {
    const response = await postApps();
    const body = await response.json();

    assert.equal(response.status, 400);
    assert.equal(body.code, 'validation');
  });

  it('returns 400 when the JSON body has no name', async () => {
    const response = await postApps({
      headers: { 'content-type': 'application/json' },
      body: '{}',
    });
    const body = await response.json();

    assert.equal(response.status, 400);
    assert.equal(body.code, 'validation');
  });
});
