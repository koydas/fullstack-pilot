import express from 'express';

const port = Number(process.env.PORT || 7000);
const appsServiceBaseUrl = process.env.APPS_SERVICE_BASE_URL || 'http://apps-service:4000';
const pollIntervalMs = Number(process.env.LOG_POLL_INTERVAL_MS || 30000);

const app = express();
app.use(express.json({ limit: '1mb' }));

const healthState = {
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

async function pollLogs() {
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

app.get('/health-summary', (_req, res) => {
  res.json({
    status: 'ok',
    generatedAt: new Date().toISOString(),
    summary: healthState,
  });
});

app.post('/pr-description', async (req, res) => {
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

pollLogs();
setInterval(pollLogs, pollIntervalMs);

app.listen(port, () => {
  console.log(`agent-service listening on http://localhost:${port}`);
});
