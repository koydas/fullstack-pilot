import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import morgan from 'morgan';
import { services, findServiceByName } from './services/index.js';

const app = express();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Minimal .env loader to keep configuration in sync with docker-compose defaults
function loadEnvFile(envFilePath) {
  if (!fs.existsSync(envFilePath)) return;

  const envContents = fs.readFileSync(envFilePath, 'utf8');
  envContents
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith('#'))
    .forEach((line) => {
      const [key, ...valueParts] = line.split('=');
      const value = valueParts.join('=');
      if (key && value && !process.env[key]) {
        process.env[key] = value;
      }
    });
}

loadEnvFile(path.resolve(__dirname, '..', '..', '.env'));
loadEnvFile(path.resolve(process.cwd(), '.env'));

const PORT = process.env.PORT || 4000;
const DEFAULT_MONGODB_URI = 'mongodb://localhost:27017/fullstack-pilot';
const MONGODB_URI = (process.env.MONGODB_URI || DEFAULT_MONGODB_URI).trim();

const SERVICE_NAME = process.env.SERVICE_NAME || process.env.SERVICE;
const SERVICE_BASE_PATH = process.env.SERVICE_BASE_PATH;

function resolveServices() {
  if (!SERVICE_NAME) {
    return services;
  }

  const normalizedName = SERVICE_NAME.trim().toLowerCase();
  const service = findServiceByName(normalizedName);

  if (!service) {
    throw new Error(
      `Unknown service "${SERVICE_NAME}". Available services: ${services
        .map((svc) => svc.name)
        .join(', ')}`
    );
  }

  return [service];
}

app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

let activeServices;

try {
  activeServices = resolveServices();
} catch (error) {
  console.error(error.message);
  process.exit(1);
}

activeServices.forEach(({ basePath, router, name }) => {
  const mountPath =
    SERVICE_BASE_PATH?.trim() ||
    (SERVICE_NAME ? '/' : basePath);

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

async function start() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log(`Connected to MongoDB at ${MONGODB_URI}`);
    app.listen(PORT, () => {
      console.log(`Server listening on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

async function shutdown() {
  console.log('Shutting down server...');
  await mongoose.connection.close();
  process.exit(0);
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

start();
