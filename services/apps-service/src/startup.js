import mongoose from 'mongoose';
import { createApp } from './app.js';
import { logger } from './logger.js';

const SHUTDOWN_TIMEOUT_MS = 10_000;

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

function closeHttpServer(server) {
  return new Promise((resolve, reject) => {
    server.close((error) => {
      if (error) {
        reject(error);
        return;
      }
      resolve();
    });
  });
}

export async function startServer(
  { port, mongodbUri, serviceName, serviceBasePath },
  {
    mongooseConnect = mongoose.connect.bind(mongoose),
    mongooseConnection = mongoose.connection,
    appFactory = createApp,
    appLogger = logger,
    processRef = process,
    setTimeoutFn = setTimeout,
    clearTimeoutFn = clearTimeout,
    shutdownTimeoutMs = SHUTDOWN_TIMEOUT_MS,
  } = {}
) {
  const app = appFactory({ serviceName, serviceBasePath });
  let server;

  try {
    await mongooseConnect(mongodbUri);
    appLogger.info({ mongodbUri: sanitizeConnectionString(mongodbUri) }, 'connected to MongoDB');

    server = app.listen(port, () => {
      appLogger.info({ port, url: `http://localhost:${port}` }, 'server listening');
    });
  } catch (error) {
    appLogger.error({ err: error }, 'failed to start server');
    processRef.exit(1);
    return;
  }

  let isShuttingDown = false;

  const shutdown = async (signal) => {
    if (isShuttingDown) {
      appLogger.info({ signal }, 'shutdown already in progress');
      return;
    }

    isShuttingDown = true;
    appLogger.info({ signal }, 'shutdown signal received');

    const safetyTimeout = setTimeoutFn(() => {
      appLogger.error({ timeoutMs: shutdownTimeoutMs }, 'graceful shutdown timed out; forcing exit');
      processRef.exit(1);
    }, shutdownTimeoutMs);

    try {
      appLogger.info('stopping HTTP server');
      await closeHttpServer(server);
      appLogger.info('HTTP server stopped');

      appLogger.info('closing MongoDB connection');
      await mongooseConnection.close();
      appLogger.info('MongoDB connection closed');

      clearTimeoutFn(safetyTimeout);
      appLogger.info('graceful shutdown complete');
      processRef.exit(0);
    } catch (error) {
      clearTimeoutFn(safetyTimeout);
      appLogger.error({ err: error }, 'graceful shutdown failed');
      processRef.exit(1);
    }
  };

  processRef.on('SIGINT', () => shutdown('SIGINT'));
  processRef.on('SIGTERM', () => shutdown('SIGTERM'));
}
