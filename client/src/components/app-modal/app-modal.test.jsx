import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import AppModal from './app-modal.jsx';
import {
  createService,
  deleteService,
  fetchServices,
} from '../../services/services/services-service.jsx';

vi.mock('../../services/services/services-service.jsx', () => ({
  fetchServices: vi.fn(),
  createService: vi.fn(),
  deleteService: vi.fn(),
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
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('shows details by default and switches tabs', async () => {
    const user = userEvent.setup();
    render(<AppModal app={app} onClose={() => {}} />);

    expect(screen.getByText(/Name:/i)).toBeInTheDocument();

    await user.click(screen.getByRole('tab', { name: /services/i }));

    expect(fetchServices).toHaveBeenCalled();
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

    expect(createService).toHaveBeenCalledWith({
      name: 'API Gateway',
      description: 'Handles routing',
    });
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

    await waitFor(() => expect(deleteService).toHaveBeenCalledWith(1));
    await waitFor(() => expect(screen.queryByText('Database')).not.toBeInTheDocument());
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
