import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import List from './list.jsx';

describe('List', () => {
  const apps = [
    { _id: '1', name: 'Alpha', createdAt: '2024-06-01T12:00:00Z' },
    { _id: '2', name: 'Beta', createdAt: '2024-06-02T12:00:00Z' },
  ];

  it('shows an empty state when there are no apps', () => {
    render(<List apps={[]} onRemove={vi.fn()} showEmpty />);

    expect(screen.getByText(/no apps yet/i)).toBeInTheDocument();
  });

  it('renders each app with its metadata', () => {
    render(<List apps={apps} onRemove={vi.fn()} showEmpty={false} />);

    apps.forEach((app) => {
      const localeDate = new Date(app.createdAt).toLocaleString();
      expect(screen.getByText(app.name)).toBeInTheDocument();
      expect(screen.getByText(`Created ${localeDate}`)).toBeInTheDocument();
    });
  });

  it('calls onRemove with the selected app', async () => {
    const user = userEvent.setup();
    const handleRemove = vi.fn();

    render(<List apps={apps} onRemove={handleRemove} />);

    await user.click(screen.getAllByRole('button', { name: /remove app/i })[1]);
    expect(handleRemove).toHaveBeenCalledWith(apps[1]);
  });
});
