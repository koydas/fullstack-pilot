import express from 'express';
import cors from 'cors';
import { monitoringMiddleware } from './middleware/monitoring.js';
import { getActiveServices } from './servicesResolver.js';
import { logger } from './logger.js';
import { getRecentRequestEvents } from './logStore.js';

export function createApp({ serviceName, serviceBasePath }) {
  const app = express();

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
