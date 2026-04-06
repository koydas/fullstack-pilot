import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

import mongoose from 'mongoose';

const CHANGELOG_COLLECTION = 'schema_migrations';
const DEFAULT_MONGODB_URI = 'mongodb://localhost:27017/fullstack-pilot';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const MIGRATIONS_DIR = path.resolve(__dirname, '../migrations');

async function ensureChangelog(db) {
  await db.collection(CHANGELOG_COLLECTION).createIndex({ id: 1 }, { unique: true });
}

async function listMigrationFiles() {
  const entries = await fs.readdir(MIGRATIONS_DIR, { withFileTypes: true });
  return entries
    .filter((entry) => entry.isFile() && entry.name.endsWith('.js'))
    .map((entry) => entry.name)
    .sort();
}

async function loadMigration(fileName) {
  const migrationUrl = pathToFileURL(path.resolve(MIGRATIONS_DIR, fileName)).href;
  return import(migrationUrl);
}

async function getAppliedMigrationIds(db) {
  const rows = await db.collection(CHANGELOG_COLLECTION).find({}, { projection: { id: 1 } }).sort({ id: 1 }).toArray();
  return rows.map((row) => row.id);
}

export async function runMigrationsUp(mongodbUri = process.env.MONGODB_URI || DEFAULT_MONGODB_URI) {
  const connection = await mongoose.createConnection(mongodbUri).asPromise();

  try {
    const db = connection.db;
    await ensureChangelog(db);

    const [files, appliedIds] = await Promise.all([listMigrationFiles(), getAppliedMigrationIds(db)]);
    const appliedSet = new Set(appliedIds);

    for (const file of files) {
      if (appliedSet.has(file)) {
        continue;
      }

      const migration = await loadMigration(file);
      await migration.up(db);
      await db.collection(CHANGELOG_COLLECTION).insertOne({ id: file, appliedAt: new Date() });
    }
  } finally {
    await connection.close();
  }
}

export async function runMigrationsDown(mongodbUri = process.env.MONGODB_URI || DEFAULT_MONGODB_URI) {
  const connection = await mongoose.createConnection(mongodbUri).asPromise();

  try {
    const db = connection.db;
    await ensureChangelog(db);

    const lastApplied = await db
      .collection(CHANGELOG_COLLECTION)
      .find({}, { projection: { id: 1 } })
      .sort({ appliedAt: -1 })
      .limit(1)
      .next();

    if (!lastApplied) {
      return null;
    }

    const migration = await loadMigration(lastApplied.id);
    await migration.down(db);
    await db.collection(CHANGELOG_COLLECTION).deleteOne({ id: lastApplied.id });
    return lastApplied.id;
  } finally {
    await connection.close();
  }
}

export async function getMigrationStatus(mongodbUri = process.env.MONGODB_URI || DEFAULT_MONGODB_URI) {
  const connection = await mongoose.createConnection(mongodbUri).asPromise();

  try {
    const db = connection.db;
    await ensureChangelog(db);

    const [files, appliedIds] = await Promise.all([listMigrationFiles(), getAppliedMigrationIds(db)]);
    const appliedSet = new Set(appliedIds);

    return files.map((file) => ({ id: file, applied: appliedSet.has(file) }));
  } finally {
    await connection.close();
  }
}

export async function createMigrationTemplate(name) {
  if (!name) {
    throw new Error('A migration name is required.');
  }

  const normalizedName = name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

  const timestamp = new Date().toISOString().replace(/[-:TZ.]/g, '').slice(0, 14);
  const fileName = `${timestamp}-${normalizedName || 'migration'}.js`;
  const targetPath = path.resolve(MIGRATIONS_DIR, fileName);
  const template = `export const up = async (db) => {\n  // implement migration\n};\n\nexport const down = async (db) => {\n  // implement rollback\n};\n`;

  await fs.writeFile(targetPath, template, { flag: 'wx' });
  return fileName;
}
