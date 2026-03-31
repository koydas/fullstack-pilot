import mongoose from 'mongoose';
import { createApp } from './app.js';
import { logger } from './logger.js';

export function sanitizeConnectionString(connectionString) {
  if (typeof connectionString !== 'string') {
    return connectionString;
  }

  try {
    const parsed = new URL(connectionString);
    if (!parsed.username && !parsed.password) {
      return connectionString;
    }

    parsed.username = '***';
    parsed.password = '***';
    return parsed.toString();
  } catch {
    return connectionString.replace(/\/\/([^/@:]+):([^/@]+)@/, '//***:***@');
  }
}

export async function startServer(
  { port, mongodbUri, serviceName, serviceBasePath },
  { mongooseConnect = mongoose.connect.bind(mongoose), appFactory = createApp, appLogger = logger, processRef = process } = {}
) {
  const app = appFactory({ serviceName, serviceBasePath });

  try {
    await mongooseConnect(mongodbUri);
    appLogger.info({ mongodbUri: sanitizeConnectionString(mongodbUri) }, 'connected to MongoDB');

    app.listen(port, () => {
      appLogger.info({ port, url: `http://localhost:${port}` }, 'server listening');
    });
  } catch (error) {
    appLogger.error({ err: error }, 'failed to start server');
    processRef.exit(1);
  }

  const shutdown = async () => {
    appLogger.info('shutting down server');
    await mongoose.connection.close();
    processRef.exit(0);
  };

  processRef.on('SIGINT', shutdown);
  processRef.on('SIGTERM', shutdown);
}
