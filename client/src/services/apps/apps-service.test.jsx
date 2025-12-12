import { createApp, deleteApp, fetchApps } from './apps-service.jsx';

const apiMocks = vi.hoisted(() => ({ get: vi.fn(), post: vi.fn(), delete: vi.fn() }));

vi.mock('axios', () => ({
  __esModule: true,
  default: {
    create: vi.fn(() => apiMocks),
  },
}));

describe('apps-service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('fetches apps from the API', async () => {
    const apps = [{ _id: '1', name: 'Demo' }];
    apiMocks.get.mockResolvedValue({ data: apps });

    const result = await fetchApps();

    expect(apiMocks.get).toHaveBeenCalledWith('/apps');
    expect(result).toEqual(apps);
  });

  it('creates a new app with the provided name', async () => {
    const created = { _id: '2', name: 'New app' };
    apiMocks.post.mockResolvedValue({ data: created });

    const result = await createApp('New app');

    expect(apiMocks.post).toHaveBeenCalledWith('/apps', { name: 'New app' });
    expect(result).toEqual(created);
  });

  it('deletes an app by id', async () => {
    apiMocks.delete.mockResolvedValue({});

    await deleteApp('123');

    expect(apiMocks.delete).toHaveBeenCalledWith('/apps/123');
  });
});
