import test from 'node:test';
import assert from 'node:assert/strict';

import { createApp, generatePrDescription } from '../src/index.js';

async function withServer(overrides, run) {
  const { app } = createApp({
    agentServiceToken: 'test-token',
    rateLimitWindowMs: 60000,
    rateLimitIpMax: 2,
    rateLimitGlobalMax: 3,
    ...overrides,
  });

  const server = await new Promise((resolve) => {
    const s = app.listen(0, () => resolve(s));
  });

  const { port } = server.address();
  const baseUrl = `http://127.0.0.1:${port}`;

  try {
    await run(baseUrl);
  } finally {
    await new Promise((resolve, reject) => {
      server.close((err) => (err ? reject(err) : resolve()));
    });
  }
}

function postPr(baseUrl, { token, ip, diff = 'diff --git a/file b/file' } = {}) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) {
    headers['X-Agent-Token'] = token;
  }
  if (ip) {
    headers['X-Forwarded-For'] = ip;
  }

  return fetch(`${baseUrl}/pr-description`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ diff }),
  });
}

test('GET /health-summary remains publicly accessible', async () => {
  await withServer({}, async (baseUrl) => {
    const response = await fetch(`${baseUrl}/health-summary`);
    const body = await response.json();

    assert.equal(response.status, 200);
    assert.equal(body.status, 'ok');
    assert.ok(body.summary);
  });
});

test('POST /pr-description returns 401 without token', async () => {
  await withServer({}, async (baseUrl) => {
    const response = await postPr(baseUrl);
    const body = await response.json();

    assert.equal(response.status, 401);
    assert.equal(body.error, 'unauthorized');
  });
});

test('POST /pr-description returns 401 with invalid token', async () => {
  await withServer({}, async (baseUrl) => {
    const response = await postPr(baseUrl, { token: 'wrong-token' });
    const body = await response.json();

    assert.equal(response.status, 401);
    assert.equal(body.error, 'unauthorized');
  });
});

test('POST /pr-description rate limit is applied before auth checks', async () => {
  await withServer({ rateLimitIpMax: 1, rateLimitGlobalMax: 10 }, async (baseUrl) => {
    const first = await postPr(baseUrl, { token: 'wrong-token' });
    const second = await postPr(baseUrl, { token: 'wrong-token' });
    const secondBody = await second.json();

    assert.equal(first.status, 401);
    assert.equal(second.status, 429);
    assert.equal(secondBody.error, 'rate_limit_exceeded');
  });
});

test('POST /pr-description accepts valid token', async () => {
  await withServer({}, async (baseUrl) => {
    const response = await postPr(baseUrl, { token: 'test-token' });
    const body = await response.json();

    assert.equal(response.status, 200);
    assert.equal(body.provider, 'fallback');
    assert.equal(body.truncated, false);
  });
});

test('POST /pr-description rejects empty diff', async () => {
  await withServer({}, async (baseUrl) => {
    const response = await postPr(baseUrl, { token: 'test-token', diff: '   ' });
    const body = await response.json();

    assert.equal(response.status, 400);
    assert.match(body.error, /diff/);
  });
});

test('POST /pr-description returns 413 when diff is too large', async () => {
  await withServer({ prDiffMaxChars: 10, prDiffOversizeMode: 'reject' }, async (baseUrl) => {
    const response = await postPr(baseUrl, {
      token: 'test-token',
      diff: 'x'.repeat(11),
    });
    const body = await response.json();

    assert.equal(response.status, 413);
    assert.equal(body.error, 'payload_too_large');
    assert.equal(body.maxChars, 10);
  });
});

test('POST /pr-description truncates oversized diff when configured', async () => {
  await withServer({ prDiffMaxChars: 10, prDiffOversizeMode: 'truncate' }, async (baseUrl) => {
    const response = await postPr(baseUrl, {
      token: 'test-token',
      diff: 'x'.repeat(11),
    });
    const body = await response.json();

    assert.equal(response.status, 200);
    assert.equal(body.provider, 'fallback');
    assert.equal(body.truncated, true);
  });
});

test('POST /pr-description applies per-IP rate limiting', async () => {
  await withServer({ rateLimitIpMax: 1, rateLimitGlobalMax: 10 }, async (baseUrl) => {
    const first = await postPr(baseUrl, { token: 'test-token', ip: '203.0.113.1' });
    const second = await postPr(baseUrl, { token: 'test-token', ip: '203.0.113.1' });

    const secondBody = await second.json();

    assert.equal(first.status, 200);
    assert.equal(second.status, 429);
    assert.equal(secondBody.error, 'rate_limit_exceeded');
  });
});

test('POST /pr-description applies global rate limiting across IPs', async () => {
  await withServer({ trustProxy: true, rateLimitIpMax: 10, rateLimitGlobalMax: 2 }, async (baseUrl) => {
    const first = await postPr(baseUrl, { token: 'test-token', ip: '203.0.113.1' });
    const second = await postPr(baseUrl, { token: 'test-token', ip: '203.0.113.2' });
    const third = await postPr(baseUrl, { token: 'test-token', ip: '203.0.113.3' });

    const thirdBody = await third.json();

    assert.equal(first.status, 200);
    assert.equal(second.status, 200);
    assert.equal(third.status, 429);
    assert.equal(thirdBody.error, 'rate_limit_exceeded');
  });
});

test('POST /pr-description ignores spoofed X-Forwarded-For when trust proxy is disabled', async () => {
  await withServer({ trustProxy: false, rateLimitIpMax: 2, rateLimitGlobalMax: 10 }, async (baseUrl) => {
    const first = await postPr(baseUrl, { token: 'test-token', ip: '198.51.100.10' });
    const second = await postPr(baseUrl, { token: 'test-token', ip: '198.51.100.11' });
    const third = await postPr(baseUrl, { token: 'test-token', ip: '198.51.100.12' });
    const thirdBody = await third.json();

    assert.equal(first.status, 200);
    assert.equal(second.status, 200);
    assert.equal(third.status, 429);
    assert.equal(thirdBody.error, 'rate_limit_exceeded');
  });
});

test('generatePrDescription reports Anthropic timeout explicitly', async () => {
  process.env.ANTHROPIC_API_KEY = 'test-key';

  const fetchImpl = (_url, { signal }) => new Promise((_resolve, reject) => {
    signal.addEventListener('abort', () => {
      const error = new Error('aborted');
      error.name = 'AbortError';
      reject(error);
    });
  });

  await assert.rejects(
    () => generatePrDescription('diff --git a/a b/a', { fetchImpl, anthropicTimeoutMs: 5 }),
    /Anthropic request timed out after 5ms/,
  );

  delete process.env.ANTHROPIC_API_KEY;
});
