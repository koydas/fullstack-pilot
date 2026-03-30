import mongoose from 'mongoose';
import { createApp } from './app.js';
import { logger } from './logger.js';

export async function startServer({ port, mongodbUri, serviceName, serviceBasePath }) {
  const app = createApp({ serviceName, serviceBasePath });

  try {
    await mongoose.connect(mongodbUri);
    logger.info({ mongodbUri }, 'connected to MongoDB');

    app.listen(port, () => {
      logger.info({ port, url: `http://localhost:${port}` }, 'server listening');
    });
  } catch (error) {
    logger.error({ err: error }, 'failed to start server');
    process.exit(1);
  }

  const shutdown = async () => {
    logger.info('shutting down server');
    await mongoose.connection.close();
    process.exit(0);
  };

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}
