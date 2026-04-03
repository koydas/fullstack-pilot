import express from 'express';
import cors from 'cors';
import { monitoringMiddleware } from './middleware/monitoring.js';
import { getActiveServices } from './servicesResolver.js';
import { logger } from './logger.js';
import { getRecentRequestEvents } from './logStore.js';

export function createApp({
  serviceName,
  serviceBasePath,
  nodeEnv = 'development',
  internalLogsToken,
  internalLogsAllowNonProd = true,
}) {
  const app = express();
  const isProduction = nodeEnv === 'production';

  app.use(cors());
  app.use(express.json());
  app.use(monitoringMiddleware);

  app.get('/healthz', (_req, res) => {
    res.json({
      status: 'ok',
      uptime: Number(process.uptime().toFixed(3)),
      timestamp: new Date().toISOString(),
    });
  });

  app.get('/internal/logs/recent', (req, res) => {
    const providedToken = req.header('x-internal-token');

    if (!isProduction && internalLogsAllowNonProd) {
      // Allow local/dev observability by default outside production.
    } else if (!internalLogsToken) {
      return res.status(403).json({
        error: 'forbidden',
        message:
          'Access to /internal/logs/recent is disabled because INTERNAL_LOGS_TOKEN is not configured.',
      });
    } else if (!providedToken) {
      return res.status(401).json({
        error: 'unauthorized',
        message: 'Missing x-internal-token header.',
      });
    } else if (providedToken !== internalLogsToken) {
      return res.status(401).json({
        error: 'unauthorized',
        message: 'Invalid internal token.',
      });
    }

    const limit = Number(req.query.limit || 100);
    const events = getRecentRequestEvents(limit);

    res.json({
      status: 'ok',
      count: events.length,
      events,
    });
  });

  const activeServices = getActiveServices(serviceName);

  activeServices.forEach(({ basePath, router, name }) => {
    const mountPath = serviceBasePath?.trim() || (serviceName ? '/' : basePath);

    if (!mountPath.startsWith('/')) {
      throw new Error(
        `Invalid mount path for service "${name}": ${mountPath}. Paths must start with '/'.`
      );
    }

    logger.info({ mountedService: name, mountPath }, 'service router registered');
    app.use(mountPath, router);
  });

  app.use((err, _req, res, _next) => {
    logger.error({ err }, 'unhandled error');
    res.status(500).json({ error: 'Internal server error' });
  });

  return app;
}
