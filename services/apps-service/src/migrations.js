import { runMigrationsUp } from './migrationsRunner.js';

export function shouldRunMigrations(nodeEnv) {
  const explicit = process.env.MONGO_MIGRATE_ON_STARTUP;
  if (explicit != null) {
    return explicit === 'true';
  }

  return nodeEnv !== 'production';
}

export async function runMongoMigrations() {
  await runMigrationsUp();
}
