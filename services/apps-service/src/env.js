import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DEFAULT_MONGODB_URI = 'mongodb://localhost:27017/fullstack-pilot';

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

export function loadEnvironment() {
  loadEnvFile(path.resolve(__dirname, '..', '.env'));
  loadEnvFile(path.resolve(process.cwd(), '.env'));
}

export function getConfig() {
  const internalLogsAllowNonProdRaw = process.env.INTERNAL_LOGS_ALLOW_NON_PROD;
  const internalLogsAllowNonProd =
    internalLogsAllowNonProdRaw == null
      ? true
      : ['1', 'true', 'yes', 'on'].includes(internalLogsAllowNonProdRaw.trim().toLowerCase());

  return {
    port: process.env.PORT || 4000,
    mongodbUri: (process.env.MONGODB_URI || DEFAULT_MONGODB_URI).trim(),
    serviceName: process.env.SERVICE_NAME || process.env.SERVICE,
    serviceBasePath: process.env.SERVICE_BASE_PATH,
    nodeEnv: process.env.NODE_ENV || 'development',
    internalLogsToken: process.env.INTERNAL_LOGS_TOKEN?.trim(),
    internalLogsAllowNonProd,
  };
}
