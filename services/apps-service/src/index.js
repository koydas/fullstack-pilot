import { loadEnvironment, getConfig } from './env.js';
import { startServer } from './startup.js';

loadEnvironment();

const {
  port,
  mongodbUri,
  serviceName,
  serviceBasePath,
  nodeEnv,
  internalLogsToken,
  internalLogsAllowNonProd,
} = getConfig();

startServer({
  port,
  mongodbUri,
  serviceName,
  serviceBasePath,
  nodeEnv,
  internalLogsToken,
  internalLogsAllowNonProd,
});
