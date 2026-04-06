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
      listen: (_port, callback) => {
        callback();
        return { close: (cb) => cb() };
      },
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
        runMigrations: async () => {},
        processRef: { on: () => {}, exit: () => {} },
      }
    );

    const connectionLog = infoLogs.find((entry) => entry[1] === 'connected to MongoDB');

    assert.ok(connectionLog);
    assert.equal(connectionLog[0].mongodbUri, 'mongodb://***:***@localhost:27017/fullstack-pilot?authSource=admin');
    assert.equal(connectionLog[0].mongodbUri.includes('dbUser'), false);
    assert.equal(connectionLog[0].mongodbUri.includes('dbPassword'), false);
  });


  it('runs mongodb migrations before opening database connection in non-production', async () => {
    const order = [];

    await startServer(
      {
        port: 4000,
        mongodbUri: 'mongodb://localhost:27017/fullstack-pilot',
        serviceName: 'apps',
        serviceBasePath: '/',
        nodeEnv: 'development',
      },
      {
        runMigrations: async () => {
          order.push('migrations');
        },
        mongooseConnect: async () => {
          order.push('connect');
        },
        appFactory: () => ({
          listen: (_port, callback) => {
            callback();
            return { close: (cb) => cb() };
          },
        }),
        appLogger: { info: () => {}, error: () => {} },
        processRef: { on: () => {}, exit: () => {} },
      }
    );

    assert.deepEqual(order, ['migrations', 'connect']);
  });


  it('retries MongoDB connection before failing startup', async () => {
    let attempts = 0;

    await startServer(
      {
        port: 4000,
        mongodbUri: 'mongodb://localhost:27017/fullstack-pilot',
        serviceName: 'apps',
        serviceBasePath: '/',
      },
      {
        mongooseConnect: async () => {
          attempts += 1;
          if (attempts < 3) {
            throw new Error('temporary connect failure');
          }
        },
        appFactory: () => ({
          listen: (_port, callback) => {
            callback();
            return { close: (cb) => cb() };
          },
        }),
        appLogger: { info: () => {}, error: () => {} },
        runMigrations: async () => {},
        processRef: { on: () => {}, exit: () => {} },
        mongoConnectRetries: 3,
        mongoConnectRetryDelayMs: 0,
      }
    );

    assert.equal(attempts, 3);
  });

  it('gracefully shuts down HTTP server then MongoDB on SIGTERM', async () => {
    const events = [];
    const handlers = {};
    const exits = [];

    const processRef = {
      on: (event, handler) => {
        handlers[event] = handler;
      },
      exit: (code) => exits.push(code),
    };

    const app = {
      listen: (_port, callback) => {
        callback();
        return {
          close: (cb) => {
            events.push('http-closed');
            cb();
          },
        };
      },
    };

    await startServer(
      {
        port: 4000,
        mongodbUri: 'mongodb://localhost:27017/fullstack-pilot',
        serviceName: 'apps',
        serviceBasePath: '/',
      },
      {
        mongooseConnect: async () => {},
        mongooseConnection: {
          close: async () => {
            events.push('mongo-closed');
          },
        },
        appFactory: () => app,
        appLogger: { info: () => {}, error: () => {} },
        runMigrations: async () => {},
        processRef,
        setTimeoutFn: () => 'timer-id',
        clearTimeoutFn: () => {},
      }
    );

    assert.ok(handlers.SIGTERM);
    await handlers.SIGTERM();

    assert.deepEqual(events, ['http-closed', 'mongo-closed']);
    assert.deepEqual(exits, [0]);
  });
});
