import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from './App.jsx';
import { createApp, deleteApp, fetchApps } from './services/apps/apps-service.jsx';

vi.mock('./services/apps/apps-service.jsx', () => ({
  fetchApps: vi.fn(),
  createApp: vi.fn(),
  deleteApp: vi.fn(),
}));

describe('App', () => {
  beforeEach(() => {
    fetchApps.mockResolvedValue([]);
    createApp.mockResolvedValue({ _id: '1', name: 'Test app', createdAt: '2024-06-01T00:00:00Z' });
    deleteApp.mockResolvedValue({});
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('loads apps on mount and shows empty state', async () => {
    render(<App />);

    expect(fetchApps).toHaveBeenCalled();
    expect(await screen.findByText(/no apps yet/i)).toBeInTheDocument();
  });

  it('creates a new app through the form', async () => {
    const user = userEvent.setup();
    render(<App />);

    const input = await screen.findByLabelText(/app name/i);
    await user.type(input, 'New app');
    await user.click(screen.getByRole('button', { name: /add app/i }));

    expect(createApp).toHaveBeenCalledWith('New app');
    await screen.findByText('Test app');
    expect(input).toHaveValue('');
  });

  it('removes an app after confirmation', async () => {
    fetchApps.mockResolvedValueOnce([
      { _id: '1', name: 'Existing app', createdAt: '2024-06-01T00:00:00Z' },
    ]);

    const user = userEvent.setup();
    render(<App />);

    await screen.findByText('Existing app');
    await user.click(screen.getByRole('button', { name: /remove app/i }));

    expect(screen.getByRole('dialog', { name: /delete existing app\?/i })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /delete app/i }));

    await waitFor(() => expect(deleteApp).toHaveBeenCalledWith('1'));
    await waitFor(() => expect(screen.queryByText('Existing app')).not.toBeInTheDocument());
  });

  it('closes the delete modal without removing when cancelled', async () => {
    fetchApps.mockResolvedValueOnce([
      { _id: '1', name: 'Existing app', createdAt: '2024-06-01T00:00:00Z' },
    ]);

    const user = userEvent.setup();
    render(<App />);

    await screen.findByText('Existing app');
    await user.click(screen.getByRole('button', { name: /remove app/i }));

    expect(screen.getByRole('dialog', { name: /delete existing app\?/i })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /cancel/i }));

    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    expect(deleteApp).not.toHaveBeenCalled();
  });

  it('opens an app modal and closes it with the close button', async () => {
    fetchApps.mockResolvedValueOnce([
      { _id: '1', name: 'Existing app', createdAt: '2024-06-01T00:00:00Z' },
    ]);

    const user = userEvent.setup();
    render(<App />);

    await screen.findByText('Existing app');
    await user.click(screen.getByRole('button', { name: /open app/i }));

    expect(screen.getByRole('dialog')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /close/i }));

    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
  });
});
