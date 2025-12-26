import assert from 'node:assert/strict';
import { beforeEach, describe, it } from 'node:test';

import { createAppsService } from '../src/services/appsService.js';

function createFakeAppModel() {
  let counter = 0;
  let store = [];

  const clone = (app) => ({ ...app });

  return {
    async find(_filter = {}, _projection, options = {}) {
      const sortDirection = options?.sort?.createdAt;
      const sorted = [...store].sort((a, b) => {
        if (sortDirection === -1) {
          return b.createdAt - a.createdAt;
        }
        if (sortDirection === 1) {
          return a.createdAt - b.createdAt;
        }
        return 0;
      });
      return sorted.map(clone);
    },
    async create(payload) {
      counter += 1;
      const now = new Date();
      const app = {
        _id: counter.toString(),
        id: counter.toString(),
        name: payload.name,
        createdAt: payload.createdAt ?? now,
        updatedAt: payload.updatedAt ?? now,
      };
      store.push(app);
      return clone(app);
    },
    async findByIdAndDelete(id) {
      const index = store.findIndex((app) => app._id === id);
      if (index === -1) {
        return null;
      }
      const [removed] = store.splice(index, 1);
      return clone(removed);
    },
    reset() {
      store = [];
      counter = 0;
    },
  };
}

const fakeModel = createFakeAppModel();
const appsService = createAppsService(fakeModel);

beforeEach(() => {
  fakeModel.reset();
});

describe('appsService', () => {
  it('creates an app with a trimmed name', async () => {
    const app = await appsService.createApp({ name: '  My App  ' });

    assert.equal(app.name, 'My App');
    assert.ok(app._id);
  });

  it('lists apps ordered from newest to oldest', async () => {
    await appsService.createApp({ name: 'First' });
    await new Promise((resolve) => setTimeout(resolve, 5));
    const newest = await appsService.createApp({ name: 'Second' });

    const apps = await appsService.listApps();

    assert.equal(apps[0].id, newest.id);
    assert.equal(apps.map((app) => app.name).join(','), 'Second,First');
  });

  it('rejects creation when the name is missing', async () => {
    await assert.rejects(() => appsService.createApp({ name: '' }), {
      message: 'App name is required.',
    });
  });

  it('deletes an existing app', async () => {
    const app = await appsService.createApp({ name: 'Temp' });

    await appsService.deleteApp(app.id);

    const remaining = await appsService.listApps();
    assert.equal(remaining.length, 0);
  });

  it('throws a not found error when deleting a missing app', async () => {
    await assert.rejects(() => appsService.deleteApp('nonexistent-id'), {
      message: 'App not found.',
    });
  });
});
