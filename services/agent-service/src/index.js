import express from 'express';

const DEFAULT_PORT = 7000;
const DEFAULT_APPS_SERVICE_BASE_URL = 'http://apps-service:4000';
const DEFAULT_LOG_POLL_INTERVAL_MS = 30000;
const DEFAULT_RATE_LIMIT_WINDOW_MS = 60000;
const DEFAULT_RATE_LIMIT_IP_MAX = 20;
const DEFAULT_RATE_LIMIT_GLOBAL_MAX = 100;

function readConfig(env = process.env) {
  return {
    port: Number(env.PORT || DEFAULT_PORT),
    appsServiceBaseUrl: env.APPS_SERVICE_BASE_URL || DEFAULT_APPS_SERVICE_BASE_URL,
    pollIntervalMs: Number(env.LOG_POLL_INTERVAL_MS || DEFAULT_LOG_POLL_INTERVAL_MS),
    agentServiceToken: env.AGENT_SERVICE_TOKEN || '',
    rateLimitWindowMs: Number(env.AGENT_SERVICE_RATE_LIMIT_WINDOW_MS || DEFAULT_RATE_LIMIT_WINDOW_MS),
    rateLimitIpMax: Number(env.AGENT_SERVICE_RATE_LIMIT_IP_MAX || DEFAULT_RATE_LIMIT_IP_MAX),
    rateLimitGlobalMax: Number(env.AGENT_SERVICE_RATE_LIMIT_GLOBAL_MAX || DEFAULT_RATE_LIMIT_GLOBAL_MAX),
  };
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
    const forwarded = req.headers['x-forwarded-for'];
    if (typeof forwarded === 'string' && forwarded.trim()) {
      return forwarded.split(',')[0].trim();
    }
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

function summarizeEvents(events) {
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

async function generatePrDescription(diff) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
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

  const response = await fetch('https://api.anthropic.com/v1/messages', {
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
  });

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

async function pollLogs(healthState, appsServiceBaseUrl) {
  try {
    const response = await fetch(`${appsServiceBaseUrl}/internal/logs/recent?limit=250`);
    if (!response.ok) {
      throw new Error(`apps-service responded ${response.status}`);
    }

    const payload = await response.json();
    const events = Array.isArray(payload?.events) ? payload.events : [];
    const summary = summarizeEvents(events);

    Object.assign(healthState, summary, {
      sourceUrl: `${appsServiceBaseUrl}/internal/logs/recent`,
      lastUpdated: new Date().toISOString(),
    });
  } catch (error) {
    healthState.lastUpdated = new Date().toISOString();
    healthState.anomalies = [
      {
        type: 'monitoring_fetch_failure',
        severity: 'high',
        message: `Failed to fetch logs from apps-service: ${error.message}`,
      },
    ];
  }
}

export function createApp(options = {}) {
  const config = { ...readConfig(), ...options };
  const app = express();
  const healthState = createHealthState(config.appsServiceBaseUrl);

  app.use(express.json({ limit: '1mb' }));

  const protectedMiddlewares = [
    requireAgentToken(config.agentServiceToken),
    buildRateLimiter(config),
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

    try {
      const result = await generatePrDescription(diff);
      return res.json(result);
    } catch (error) {
      return res.status(502).json({
        error: 'Failed to generate PR description',
        details: error.message,
      });
    }
  });

  return {
    app,
    poll: () => pollLogs(healthState, config.appsServiceBaseUrl),
    pollIntervalMs: config.pollIntervalMs,
    port: config.port,
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
