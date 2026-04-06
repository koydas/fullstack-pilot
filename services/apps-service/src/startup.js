import mongoose from 'mongoose';
import { createApp } from './app.js';
import { logger } from './logger.js';
import { runMongoMigrations, shouldRunMigrations } from './migrations.js';

const SHUTDOWN_TIMEOUT_MS = 10_000;
const MONGO_CONNECT_RETRIES = Number.parseInt(process.env.MONGO_CONNECT_RETRIES || '10', 10);
const MONGO_CONNECT_RETRY_DELAY_MS = Number.parseInt(process.env.MONGO_CONNECT_RETRY_DELAY_MS || '1000', 10);

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function connectWithRetries(mongooseConnect, mongodbUri, appLogger, retries, retryDelayMs) {
  let lastError;

  for (let attempt = 1; attempt <= retries; attempt += 1) {
    try {
      await mongooseConnect(mongodbUri);
      return;
    } catch (error) {
      lastError = error;
      const message = error?.message || String(error);
      if (attempt < retries) {
        appLogger.info({ attempt, retries, retryDelayMs, error: message }, 'mongo connection failed, retrying');
        await wait(retryDelayMs);
      }
    }
  }

  throw lastError;
}

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
  {
    port,
    mongodbUri,
    serviceName,
    serviceBasePath,
    nodeEnv,
    internalLogsToken,
    internalLogsAllowNonProd,
  },
  {
    mongooseConnect = mongoose.connect.bind(mongoose),
    mongooseConnection = mongoose.connection,
    appFactory = createApp,
    appLogger = logger,
    processRef = process,
    runMigrations = runMongoMigrations,
    setTimeoutFn = setTimeout,
    clearTimeoutFn = clearTimeout,
    shutdownTimeoutMs = SHUTDOWN_TIMEOUT_MS,
    mongoConnectRetries = MONGO_CONNECT_RETRIES,
    mongoConnectRetryDelayMs = MONGO_CONNECT_RETRY_DELAY_MS,
  } = {}
) {
  const app = appFactory({
    serviceName,
    serviceBasePath,
    nodeEnv,
    internalLogsToken,
    internalLogsAllowNonProd,
  });
  let server;

  try {
    if (shouldRunMigrations(nodeEnv)) {
      await runMigrations();
      appLogger.info('mongodb migrations applied');
    }

    await connectWithRetries(mongooseConnect, mongodbUri, appLogger, mongoConnectRetries, mongoConnectRetryDelayMs);
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
