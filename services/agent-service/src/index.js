import express from 'express';

const DEFAULT_PORT = 7000;
const DEFAULT_APPS_SERVICE_BASE_URL = 'http://apps-service:4000';
const DEFAULT_LOG_POLL_INTERVAL_MS = 30000;
const DEFAULT_RATE_LIMIT_WINDOW_MS = 60000;
const DEFAULT_RATE_LIMIT_IP_MAX = 20;
const DEFAULT_RATE_LIMIT_GLOBAL_MAX = 100;
const DEFAULT_TRUST_PROXY = false;
const DEFAULT_PR_DIFF_MAX_CHARS = 100000;
const DEFAULT_PR_DIFF_OVERSIZE_MODE = 'reject';
const DEFAULT_ANTHROPIC_TIMEOUT_MS = 10000;
const DEFAULT_POLL_FETCH_TIMEOUT_MS = 4000;
const DEFAULT_POLL_FETCH_MAX_ATTEMPTS = 3;
const DEFAULT_POLL_FETCH_BASE_BACKOFF_MS = 250;
const DEFAULT_POLL_CIRCUIT_FAILURE_THRESHOLD = 3;
const DEFAULT_POLL_CIRCUIT_COOLDOWN_MS = 120000;

function readPositiveInt(value, fallback) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? Math.floor(parsed) : fallback;
}

function readConfig(env = process.env) {
  return {
    port: Number(env.PORT || DEFAULT_PORT),
    appsServiceBaseUrl: env.APPS_SERVICE_BASE_URL || DEFAULT_APPS_SERVICE_BASE_URL,
    pollIntervalMs: Number(env.LOG_POLL_INTERVAL_MS || DEFAULT_LOG_POLL_INTERVAL_MS),
    agentServiceToken: env.AGENT_SERVICE_TOKEN || '',
    rateLimitWindowMs: Number(env.AGENT_SERVICE_RATE_LIMIT_WINDOW_MS || DEFAULT_RATE_LIMIT_WINDOW_MS),
    rateLimitIpMax: Number(env.AGENT_SERVICE_RATE_LIMIT_IP_MAX || DEFAULT_RATE_LIMIT_IP_MAX),
    rateLimitGlobalMax: Number(env.AGENT_SERVICE_RATE_LIMIT_GLOBAL_MAX || DEFAULT_RATE_LIMIT_GLOBAL_MAX),
    trustProxy: String(env.AGENT_SERVICE_TRUST_PROXY || DEFAULT_TRUST_PROXY) === 'true',
    prDiffMaxChars: readPositiveInt(env.PR_DIFF_MAX_CHARS, DEFAULT_PR_DIFF_MAX_CHARS),
    prDiffOversizeMode: env.PR_DIFF_OVERSIZE_MODE === 'truncate' ? 'truncate' : DEFAULT_PR_DIFF_OVERSIZE_MODE,
    anthropicTimeoutMs: readPositiveInt(env.ANTHROPIC_TIMEOUT_MS, DEFAULT_ANTHROPIC_TIMEOUT_MS),
    pollFetchTimeoutMs: readPositiveInt(env.POLL_FETCH_TIMEOUT_MS, DEFAULT_POLL_FETCH_TIMEOUT_MS),
    pollFetchMaxAttempts: readPositiveInt(env.POLL_FETCH_MAX_ATTEMPTS, DEFAULT_POLL_FETCH_MAX_ATTEMPTS),
    pollFetchBaseBackoffMs: readPositiveInt(env.POLL_FETCH_BASE_BACKOFF_MS, DEFAULT_POLL_FETCH_BASE_BACKOFF_MS),
    pollCircuitFailureThreshold: readPositiveInt(
      env.POLL_CIRCUIT_FAILURE_THRESHOLD,
      DEFAULT_POLL_CIRCUIT_FAILURE_THRESHOLD,
    ),
    pollCircuitCooldownMs: readPositiveInt(env.POLL_CIRCUIT_COOLDOWN_MS, DEFAULT_POLL_CIRCUIT_COOLDOWN_MS),
  };
}

function logPollEvent(event, details = {}) {
  console.log(JSON.stringify({
    service: 'agent-service',
    component: 'pollLogs',
    event,
    ...details,
  }));
}

function buildRateLimiter({ rateLimitWindowMs, rateLimitIpMax, rateLimitGlobalMax }) {
  let globalWindowStart = Date.now();
  let globalCount = 0;
  const ipCounters = new Map();

  function resetWindow(now) {
    if (now - globalWindowStart >= rateLimitWindowMs) {
      globalWindowStart = now;
      globalCount = 0;
      ipCounters.clear();
    }
  }

  function resolveIp(req) {
    return req.ip || req.socket?.remoteAddress || 'unknown';
  }

  return function rateLimitMiddleware(req, res, next) {
    const now = Date.now();
    resetWindow(now);

    const ip = resolveIp(req);
    const ipCount = (ipCounters.get(ip) || 0) + 1;
    const nextGlobalCount = globalCount + 1;

    if (ipCount > rateLimitIpMax) {
      return res.status(429).json({
        error: 'rate_limit_exceeded',
        message: 'Too many requests for this IP. Please retry later.',
      });
    }

    if (nextGlobalCount > rateLimitGlobalMax) {
      return res.status(429).json({
        error: 'rate_limit_exceeded',
        message: 'Too many requests globally. Please retry later.',
      });
    }

    ipCounters.set(ip, ipCount);
    globalCount = nextGlobalCount;
    return next();
  };
}

function requireAgentToken(agentServiceToken) {
  return function authMiddleware(req, res, next) {
    if (!agentServiceToken) {
      return res.status(500).json({
        error: 'configuration_error',
        message: 'AGENT_SERVICE_TOKEN is not configured.',
      });
    }

    const provided = req.get('X-Agent-Token');
    if (provided !== agentServiceToken) {
      return res.status(401).json({
        error: 'unauthorized',
        message: 'Missing or invalid X-Agent-Token header.',
      });
    }

    return next();
  };
}

function countTop(entries, key, limit = 5) {
  const counter = new Map();
  entries.forEach((entry) => {
    const value = entry?.[key] || 'unknown';
    counter.set(value, (counter.get(value) || 0) + 1);
  });

  return [...counter.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([value, count]) => ({ value, count }));
}

export function summarizeEvents(events) {
  const total = events.length;
  const errors = events.filter((event) => Number(event.statusCode) >= 500);
  const slow = events.filter((event) => Number(event.durationMs) >= 1000);
  const avgDurationMs = total
    ? Number((events.reduce((sum, event) => sum + Number(event.durationMs || 0), 0) / total).toFixed(2))
    : 0;

  const errorPatterns = {};
  errors.forEach((event) => {
    const key = `${event.method || 'UNKNOWN'} ${event.path || '/'} ${event.statusCode || 500}`;
    errorPatterns[key] = (errorPatterns[key] || 0) + 1;
  });

  const anomalies = [];
  if (errors.length > 0) {
    anomalies.push({
      type: 'server_errors',
      severity: errors.length > 5 ? 'high' : 'medium',
      count: errors.length,
      message: `Detected ${errors.length} server error request(s)`,
    });
  }
  if (slow.length > 0) {
    anomalies.push({
      type: 'slow_requests',
      severity: slow.length > 10 ? 'high' : 'low',
      count: slow.length,
      message: `Detected ${slow.length} slow request(s) over 1000ms`,
    });
  }

  return {
    totalEvents: total,
    anomalies,
    errorPatterns,
    requestTrends: {
      totalRequests: total,
      errorRate: total ? Number(((errors.length / total) * 100).toFixed(2)) : 0,
      topPaths: countTop(events, 'path'),
      topMethods: countTop(events, 'method'),
      avgDurationMs,
    },
  };
}

export async function generatePrDescription(diff, options = {}) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  const fetchImpl = options.fetchImpl || fetch;
  const anthropicTimeoutMs = readPositiveInt(options.anthropicTimeoutMs, DEFAULT_ANTHROPIC_TIMEOUT_MS);
  const fallback = {
    summary: 'Unable to generate AI summary because ANTHROPIC_API_KEY is missing.',
    impact: ['PR description fallback mode enabled.'],
    risks: ['AI generation unavailable until ANTHROPIC_API_KEY is configured.'],
  };

  if (!apiKey) {
    return { provider: 'fallback', model: null, description: fallback };
  }

  const prompt = [
    'You are generating a pull request description from a git diff.',
    'Return valid JSON only with keys: summary (string), impact (string[]), risks (string[]).',
    'Keep it concise and factual.',
    'Git diff:',
    diff,
  ].join('\n\n');

  const abortController = new AbortController();
  const timeoutId = setTimeout(() => abortController.abort(), anthropicTimeoutMs);

  let response;
  try {
    response = await fetchImpl('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 800,
        temperature: 0.1,
        messages: [{ role: 'user', content: prompt }],
      }),
      signal: abortController.signal,
    });
  } catch (error) {
    if (error?.name === 'AbortError') {
      throw new Error(`Anthropic request timed out after ${anthropicTimeoutMs}ms`);
    }

    throw new Error(`Anthropic request failed: ${error.message}`);
  } finally {
    clearTimeout(timeoutId);
  }

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Anthropic API error (${response.status}): ${body.slice(0, 300)}`);
  }

  const data = await response.json();
  const text = data?.content?.[0]?.text;
  if (!text) {
    throw new Error('Anthropic response did not include text content.');
  }

  let parsed;
  try {
    parsed = JSON.parse(text);
  } catch {
    parsed = {
      summary: text,
      impact: [],
      risks: [],
    };
  }

  return {
    provider: 'anthropic',
    model: 'claude-sonnet-4-20250514',
    description: {
      summary: String(parsed.summary || ''),
      impact: Array.isArray(parsed.impact) ? parsed.impact.map(String) : [],
      risks: Array.isArray(parsed.risks) ? parsed.risks.map(String) : [],
    },
  };
}

function createHealthState(appsServiceBaseUrl) {
  return {
    lastUpdated: null,
    lastSuccessAt: null,
    lastErrorAt: null,
    consecutiveFailures: 0,
    nextPollAllowedAt: null,
    sourceUrl: `${appsServiceBaseUrl}/internal/logs/recent`,
    totalEvents: 0,
    anomalies: [],
    errorPatterns: {},
    requestTrends: {
      totalRequests: 0,
      errorRate: 0,
      topPaths: [],
      topMethods: [],
      avgDurationMs: 0,
    },
  };
}

function sleep(ms, sleepFn = setTimeout) {
  return new Promise((resolve) => sleepFn(resolve, ms));
}

async function fetchLogsWithTimeout(fetchImpl, url, timeoutMs) {
  const abortController = new AbortController();
  const timeoutId = setTimeout(() => abortController.abort(), timeoutMs);
  try {
    return await fetchImpl(url, { signal: abortController.signal });
  } catch (error) {
    if (error?.name === 'AbortError') {
      throw new Error(`apps-service request timed out after ${timeoutMs}ms`);
    }
    throw error;
  } finally {
    clearTimeout(timeoutId);
  }
}

async function pollLogs(healthState, config, deps = {}) {
  const fetchImpl = deps.fetchImpl || fetch;
  const nowFn = deps.nowFn || Date.now;
  const sleepFn = deps.sleepFn || setTimeout;
  const now = nowFn();
  const sourceUrl = `${config.appsServiceBaseUrl}/internal/logs/recent`;

  if (healthState.nextPollAllowedAt && now < Date.parse(healthState.nextPollAllowedAt)) {
    logPollEvent('poll_skipped_circuit_open', {
      now: new Date(now).toISOString(),
      nextPollAllowedAt: healthState.nextPollAllowedAt,
      consecutiveFailures: healthState.consecutiveFailures,
    });
    return;
  }

  let lastError;
  for (let attempt = 1; attempt <= config.pollFetchMaxAttempts; attempt += 1) {
    try {
      const response = await fetchLogsWithTimeout(
        fetchImpl,
        `${sourceUrl}?limit=250`,
        config.pollFetchTimeoutMs,
      );
      if (!response.ok) {
        throw new Error(`apps-service responded ${response.status}`);
      }

      const payload = await response.json();
      const events = Array.isArray(payload?.events) ? payload.events : [];
      const summary = summarizeEvents(events);
      const updatedAt = new Date(nowFn()).toISOString();
      const previousFailures = healthState.consecutiveFailures;

      Object.assign(healthState, summary, {
        sourceUrl,
        lastUpdated: updatedAt,
        lastSuccessAt: updatedAt,
        consecutiveFailures: 0,
        nextPollAllowedAt: null,
      });

      logPollEvent(previousFailures > 0 ? 'poll_recovered' : 'poll_success', {
        attemptsUsed: attempt,
        eventsFetched: events.length,
        previousFailures,
      });
      return;
    } catch (error) {
      lastError = error;
      const retriesLeft = config.pollFetchMaxAttempts - attempt;
      logPollEvent('poll_attempt_failed', {
        attempt,
        retriesLeft,
        error: error.message,
      });

      if (retriesLeft > 0) {
        const backoffMs = config.pollFetchBaseBackoffMs * (2 ** (attempt - 1));
        await sleep(backoffMs, sleepFn);
      }
    }
  }

  const failedAtIso = new Date(nowFn()).toISOString();
  healthState.lastUpdated = failedAtIso;
  healthState.lastErrorAt = failedAtIso;
  healthState.consecutiveFailures += 1;
  healthState.anomalies = [
    {
      type: 'monitoring_fetch_failure',
      severity: 'high',
      message: `Failed to fetch logs from apps-service: ${lastError.message}`,
    },
  ];

  if (healthState.consecutiveFailures >= config.pollCircuitFailureThreshold) {
    healthState.nextPollAllowedAt = new Date(nowFn() + config.pollCircuitCooldownMs).toISOString();
    logPollEvent('circuit_opened', {
      consecutiveFailures: healthState.consecutiveFailures,
      nextPollAllowedAt: healthState.nextPollAllowedAt,
    });
  }
}

export function createApp(options = {}) {
  const config = { ...readConfig(), ...options };
  const app = express();
  const healthState = createHealthState(config.appsServiceBaseUrl);
  const pollDeps = options.pollDeps || {};

  app.set('trust proxy', config.trustProxy);
  app.use(express.json({ limit: '1mb' }));

  const protectedMiddlewares = [
    buildRateLimiter(config),
    requireAgentToken(config.agentServiceToken),
  ];

  app.get('/health-summary', (_req, res) => {
    res.json({
      status: 'ok',
      generatedAt: new Date().toISOString(),
      summary: healthState,
    });
  });

  app.post('/pr-description', ...protectedMiddlewares, async (req, res) => {
    const diff = req.body?.diff;
    if (typeof diff !== 'string' || !diff.trim()) {
      return res.status(400).json({ error: 'Field "diff" (string) is required.' });
    }

    let effectiveDiff = diff;
    let truncated = false;

    if (effectiveDiff.length > config.prDiffMaxChars) {
      if (config.prDiffOversizeMode === 'truncate') {
        effectiveDiff = effectiveDiff.slice(0, config.prDiffMaxChars);
        truncated = true;
      } else {
        return res.status(413).json({
          error: 'payload_too_large',
          message: `Field "diff" exceeds maximum size of ${config.prDiffMaxChars} characters.`,
          maxChars: config.prDiffMaxChars,
        });
      }
    }

    try {
      const result = await generatePrDescription(effectiveDiff, {
        anthropicTimeoutMs: config.anthropicTimeoutMs,
      });
      return res.json({ ...result, truncated });
    } catch (error) {
      const isTimeout = error.message.startsWith('Anthropic request timed out');
      return res.status(502).json({
        error: isTimeout ? 'upstream_timeout' : 'upstream_api_error',
        message: isTimeout ? 'Anthropic request timed out.' : 'Failed to generate PR description.',
        details: error.message,
      });
    }
  });

  return {
    app,
    poll: () => pollLogs(healthState, config, pollDeps),
    pollIntervalMs: config.pollIntervalMs,
    port: config.port,
    healthState,
  };
}

export function startServer(options = {}) {
  const serverContext = createApp(options);
  serverContext.poll();
  const intervalId = setInterval(serverContext.poll, serverContext.pollIntervalMs);

  const server = serverContext.app.listen(serverContext.port, () => {
    console.log(`agent-service listening on http://localhost:${serverContext.port}`);
  });

  return { server, intervalId };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  startServer();
}
