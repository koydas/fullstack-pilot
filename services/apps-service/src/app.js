import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import { monitoringMiddleware } from './middleware/monitoring.js';
import { getActiveServices } from './servicesResolver.js';

export function createApp({ serviceName, serviceBasePath }) {
  const app = express();

  app.use(cors());
  app.use(express.json());
  app.use(morgan('dev'));
  app.use(monitoringMiddleware);

  const activeServices = getActiveServices(serviceName);

  activeServices.forEach(({ basePath, router, name }) => {
    const mountPath = serviceBasePath?.trim() || (serviceName ? '/' : basePath);

    if (!mountPath.startsWith('/')) {
      throw new Error(
        `Invalid mount path for service "${name}": ${mountPath}. Paths must start with '/'.`
      );
    }

    console.log(`Registering service "${name}" at ${mountPath}`);
    app.use(mountPath, router);
  });

  app.use((err, _req, res, _next) => {
    console.error('Unhandled error:', err);
    res.status(500).json({ error: 'Internal server error' });
  });

  return app;
}
