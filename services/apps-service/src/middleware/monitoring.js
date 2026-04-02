import { logger } from '../logger.js';
import { addRequestEvent } from '../logStore.js';

export function monitoringMiddleware(req, res, next) {
  const startTime = process.hrtime.bigint();

  res.on('finish', () => {
    const durationMs = Number(process.hrtime.bigint() - startTime) / 1e6;

    const sanitizedPath = req.path;
    const event = {
      timestamp: new Date().toISOString(),
      method: req.method,
      path: sanitizedPath,
      statusCode: res.statusCode,
      durationMs: Number(durationMs.toFixed(2)),
    };

    if (sanitizedPath !== '/internal/logs/recent') {
      addRequestEvent(event);
    }

    logger.info(event, 'request completed');
  });

  next();
}
