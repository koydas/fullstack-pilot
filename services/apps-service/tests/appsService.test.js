import assert from 'node:assert/strict';
import { beforeEach, describe, it } from 'node:test';

import { createAppsService } from '../src/services/appsService.js';

function createFakeAppModel() {
  let counter = 0;
  let store = [];

  const clone = (app) => ({ ...app });
  const toObjectId = (value) => value.toString(16).padStart(24, '0');

  return {
    async find(_filter = {}, _projection, options = {}) {
      const sortDirection = options?.sort?.createdAt;
      const limit = options?.limit;
      const skip = options?.skip ?? 0;
      const sorted = [...store].sort((a, b) => {
        if (sortDirection === -1) {
          return b.createdAt - a.createdAt;
        }
        if (sortDirection === 1) {
          return a.createdAt - b.createdAt;
        }
        return 0;
      });
      const start = Math.max(skip, 0);
      const end = Number.isFinite(limit) ? start + limit : undefined;
      return sorted.slice(start, end).map(clone);
    },
    async countDocuments() {
      return store.length;
    },
    async create(payload) {
      counter += 1;
      const now = new Date();
      const objectId = toObjectId(counter);
      const app = {
        _id: objectId,
        id: objectId,
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

    const result = await appsService.listApps();
    const apps = result.items;

    assert.equal(apps[0].id, newest.id);
    assert.equal(apps.map((app) => app.name).join(','), 'Second,First');
    assert.equal(result.total, 2);
  });

  it('supports pagination for apps listing', async () => {
    await appsService.createApp({ name: 'First' });
    await new Promise((resolve) => setTimeout(resolve, 5));
    await appsService.createApp({ name: 'Second' });
    await new Promise((resolve) => setTimeout(resolve, 5));
    await appsService.createApp({ name: 'Third' });

    const result = await appsService.listApps({ limit: 2, offset: 1 });

    assert.equal(result.items.length, 2);
    assert.equal(result.items.map((app) => app.name).join(','), 'Second,First');
    assert.equal(result.total, 3);
    assert.equal(result.limit, 2);
    assert.equal(result.offset, 1);
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
    assert.equal(remaining.items.length, 0);
  });

  it('throws a validation error when deleting with an invalid app id', async () => {
    await assert.rejects(() => appsService.deleteApp('nonexistent-id'), {
      message: 'Invalid app id.',
    });
  });

  it('throws a not found error when deleting a missing app with a valid id', async () => {
    await assert.rejects(() => appsService.deleteApp('507f1f77bcf86cd799439011'), {
      message: 'App not found.',
    });
  });
});
