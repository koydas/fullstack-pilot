import mongoose from 'mongoose';
import { createApp } from './app.js';

export async function startServer({ port, mongodbUri, serviceName, serviceBasePath }) {
  const app = createApp({ serviceName, serviceBasePath });

  try {
    await mongoose.connect(mongodbUri);
    console.log(`Connected to MongoDB at ${mongodbUri}`);

    app.listen(port, () => {
      console.log(`Server listening on http://localhost:${port}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }

  const shutdown = async () => {
    console.log('Shutting down server...');
    await mongoose.connection.close();
    process.exit(0);
  };

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}
