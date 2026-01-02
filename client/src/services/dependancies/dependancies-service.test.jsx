import { createDependancy, deleteDependancy, fetchDependancies } from './dependancies-service.jsx';

const apiMocks = vi.hoisted(() => ({ get: vi.fn(), post: vi.fn(), delete: vi.fn() }));

vi.mock('axios', () => ({
  __esModule: true,
  default: {
    create: vi.fn(() => apiMocks),
  },
}));

describe('dependancies-service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('fetches dependancies from the API with app scope', async () => {
    const dependancies = [{ id: '1', name: 'React' }];
    apiMocks.get.mockResolvedValue({ data: dependancies });

    const result = await fetchDependancies('app-1');

    expect(apiMocks.get).toHaveBeenCalledWith('/dependancies', { params: { appId: 'app-1' } });
    expect(result).toEqual(dependancies);
  });

  it('creates a new dependancy with provided payload and app id', async () => {
    const payload = { name: 'Axios', description: 'HTTP client' };
    const created = { id: '2', ...payload };
    apiMocks.post.mockResolvedValue({ data: created });

    const result = await createDependancy(payload, 'app-1');

    expect(apiMocks.post).toHaveBeenCalledWith('/dependancies', { ...payload, appId: 'app-1' });
    expect(result).toEqual(created);
  });

  it('deletes a dependancy by id with app id', async () => {
    apiMocks.delete.mockResolvedValue({});

    await deleteDependancy('123', 'app-1');

    expect(apiMocks.delete).toHaveBeenCalledWith('/dependancies/123', { params: { appId: 'app-1' } });
  });
});
