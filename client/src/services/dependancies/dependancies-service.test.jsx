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

  it('fetches dependancies from the API', async () => {
    const dependancies = [{ id: '1', name: 'React' }];
    apiMocks.get.mockResolvedValue({ data: dependancies });

    const result = await fetchDependancies();

    expect(apiMocks.get).toHaveBeenCalledWith('/dependancies');
    expect(result).toEqual(dependancies);
  });

  it('creates a new dependancy with provided payload', async () => {
    const payload = { name: 'Axios', description: 'HTTP client' };
    const created = { id: '2', ...payload };
    apiMocks.post.mockResolvedValue({ data: created });

    const result = await createDependancy(payload);

    expect(apiMocks.post).toHaveBeenCalledWith('/dependancies', payload);
    expect(result).toEqual(created);
  });

  it('deletes a dependancy by id', async () => {
    apiMocks.delete.mockResolvedValue({});

    await deleteDependancy('123');

    expect(apiMocks.delete).toHaveBeenCalledWith('/dependancies/123');
  });
});
