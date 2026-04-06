#!/usr/bin/env node
import {
  createMigrationTemplate,
  getMigrationStatus,
  runMigrationsDown,
  runMigrationsUp,
} from '../src/migrationsRunner.js';

const [, , command, ...args] = process.argv;

async function main() {
  switch (command) {
    case 'up':
      await runMigrationsUp();
      console.log('Mongo migrations applied.');
      break;
    case 'down': {
      const reverted = await runMigrationsDown();
      console.log(reverted ? `Mongo migration reverted: ${reverted}` : 'No migration to revert.');
      break;
    }
    case 'status': {
      const status = await getMigrationStatus();
      for (const item of status) {
        console.log(`${item.applied ? '[x]' : '[ ]'} ${item.id}`);
      }
      break;
    }
    case 'create': {
      const migrationName = args.join(' ');
      const fileName = await createMigrationTemplate(migrationName);
      console.log(`Created migration: ${fileName}`);
      break;
    }
    default:
      console.error('Usage: node scripts/migrate.js <up|down|status|create> [migration-name]');
      process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
