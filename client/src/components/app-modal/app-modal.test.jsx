import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import AppModal from './app-modal.jsx';
import {
  createService,
  deleteService,
  fetchServices,
} from '../../services/services/services-service.jsx';
import {
  createDependancy,
  deleteDependancy,
  fetchDependancies,
} from '../../services/dependancies/dependancies-service.jsx';

vi.mock('../../services/services/services-service.jsx', () => ({
  fetchServices: vi.fn(),
  createService: vi.fn(),
  deleteService: vi.fn(),
}));

vi.mock('../../services/dependancies/dependancies-service.jsx', () => ({
  fetchDependancies: vi.fn(),
  createDependancy: vi.fn(),
  deleteDependancy: vi.fn(),
}));

const app = {
  _id: '1',
  name: 'Example app',
  createdAt: '2024-06-01T00:00:00Z',
};

describe('AppModal', () => {
  beforeEach(() => {
    fetchServices.mockResolvedValue([]);
    createService.mockResolvedValue({
      id: 2,
      name: 'API Gateway',
      description: 'Routes traffic to downstream services',
    });
    deleteService.mockResolvedValue({});
    fetchDependancies.mockResolvedValue([]);
    createDependancy.mockResolvedValue({ id: 'd2', name: 'Axios', description: '' });
    deleteDependancy.mockResolvedValue({});
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('shows details by default and switches tabs', async () => {
    const user = userEvent.setup();
    render(<AppModal app={app} onClose={() => {}} />);

    expect(screen.getByText(/Name:/i)).toBeInTheDocument();

    await user.click(screen.getByRole('tab', { name: /services/i }));

    expect(fetchServices).toHaveBeenCalledWith(app._id);
    await screen.findByText(/no services found/i);
  });

  it('creates a service from the services tab', async () => {
    const user = userEvent.setup();
    render(<AppModal app={app} onClose={() => {}} />);

    await user.click(screen.getByRole('tab', { name: /services/i }));
    await screen.findByText(/no services found/i);

    await user.type(screen.getByLabelText(/service name/i), 'API Gateway');
    await user.type(screen.getByLabelText(/description/i), 'Handles routing');
    await user.click(screen.getByRole('button', { name: /add service/i }));

    expect(createService).toHaveBeenCalledWith(
      {
        name: 'API Gateway',
        description: 'Handles routing',
      },
      app._id
    );
    await screen.findByText('API Gateway');
  });

  it('removes a service from the list', async () => {
    fetchServices.mockResolvedValueOnce([
      { id: 1, name: 'Database', description: 'PostgreSQL store' },
    ]);

    const user = userEvent.setup();
    render(<AppModal app={app} onClose={() => {}} />);

    await user.click(screen.getByRole('tab', { name: /services/i }));

    await screen.findByText('Database');
    await user.click(screen.getByRole('button', { name: /remove database service/i }));

    await waitFor(() => expect(deleteService).toHaveBeenCalledWith(1, app._id));
    await waitFor(() => expect(screen.queryByText('Database')).not.toBeInTheDocument());
  });

  it('reloads services when opening another app', async () => {
    const user = userEvent.setup();
    const { rerender } = render(<AppModal app={app} onClose={() => {}} />);

    await user.click(screen.getByRole('tab', { name: /services/i }));
    await screen.findByText(/no services found/i);
    expect(fetchServices).toHaveBeenCalledWith('1');

    const secondApp = { ...app, _id: '2', name: 'Second app' };
    fetchServices.mockResolvedValueOnce([{ id: 99, name: 'API Gateway', description: '' }]);

    rerender(<AppModal app={secondApp} onClose={() => {}} />);
    await user.click(screen.getByRole('tab', { name: /services/i }));

    await screen.findByText('API Gateway');
    expect(fetchServices).toHaveBeenCalledWith('2');
  });

  it('scopes dependencies to the active app', async () => {
    fetchDependancies.mockResolvedValueOnce([
      { id: 'd1', name: 'Dep for app 1', appId: '1' },
      { id: 'd2', name: 'Shared dep', appId: '2' },
    ]);

    const user = userEvent.setup();
    render(<AppModal app={app} onClose={() => {}} />);

    await user.click(screen.getByRole('tab', { name: /dependencies/i }));

    expect(fetchDependancies).toHaveBeenCalledWith('1');
    await screen.findByText('Dep for app 1');
    expect(screen.queryByText('Shared dep')).not.toBeInTheDocument();
  });

  it('calls onClose when backdrop or close button is clicked', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();

    render(<AppModal app={app} onClose={onClose} />);

    await user.click(screen.getByRole('button', { name: /close/i }));
    expect(onClose).toHaveBeenCalledTimes(1);

    await user.click(screen.getByRole('presentation'));
    expect(onClose).toHaveBeenCalledTimes(2);
  });
});
