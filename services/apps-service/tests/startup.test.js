import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { sanitizeConnectionString, startServer } from '../src/startup.js';

describe('startup logging sanitization', () => {
  it('redacts username and password from mongodb connection strings', () => {
    const rawUri = 'mongodb://dbUser:dbPassword@localhost:27017/fullstack-pilot?authSource=admin';

    const sanitizedUri = sanitizeConnectionString(rawUri);

    assert.equal(sanitizedUri, 'mongodb://***:***@localhost:27017/fullstack-pilot?authSource=admin');
    assert.equal(sanitizedUri.includes('dbUser'), false);
    assert.equal(sanitizedUri.includes('dbPassword'), false);
  });

  it('logs only sanitized mongodb uri on startup', async () => {
    const rawUri = 'mongodb://dbUser:dbPassword@localhost:27017/fullstack-pilot?authSource=admin';
    const infoLogs = [];

    const appLogger = {
      info: (...args) => infoLogs.push(args),
      error: () => {},
    };

    const app = {
      listen: (_port, callback) => callback(),
    };

    await startServer(
      {
        port: 4000,
        mongodbUri: rawUri,
        serviceName: 'apps',
        serviceBasePath: '/',
      },
      {
        mongooseConnect: async () => {},
        appFactory: () => app,
        appLogger,
        processRef: { on: () => {}, exit: () => {} },
      }
    );

    const connectionLog = infoLogs.find((entry) => entry[1] === 'connected to MongoDB');

    assert.ok(connectionLog);
    assert.equal(connectionLog[0].mongodbUri, 'mongodb://***:***@localhost:27017/fullstack-pilot?authSource=admin');
    assert.equal(connectionLog[0].mongodbUri.includes('dbUser'), false);
    assert.equal(connectionLog[0].mongodbUri.includes('dbPassword'), false);
  });
});
