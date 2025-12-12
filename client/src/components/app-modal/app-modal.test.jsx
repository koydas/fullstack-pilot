import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import AppModal from './app-modal.jsx';

const app = {
  _id: '1',
  name: 'Example app',
  createdAt: '2024-06-01T00:00:00Z',
};

describe('AppModal', () => {
  it('shows details by default and switches tabs', async () => {
    const user = userEvent.setup();
    render(<AppModal app={app} onClose={() => {}} />);

    expect(screen.getByText(/Name:/i)).toBeInTheDocument();

    await user.click(screen.getByRole('tab', { name: /services/i }));

    expect(screen.getByText(/API Gateway/i)).toBeInTheDocument();
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
