import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import DeleteAppModal from './delete-app-modal.jsx';

const app = {
  _id: '1',
  name: 'Example app',
  createdAt: '2024-06-01T00:00:00Z',
};

describe('DeleteAppModal', () => {
  it('renders confirmation copy for the app', () => {
    render(
      <DeleteAppModal app={app} onCancel={() => {}} onConfirm={() => {}} loading={false} />
    );

    expect(screen.getByRole('dialog', { name: /delete "example app"\?/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /delete "example app"\?/i })).toBeInTheDocument();
    expect(screen.getByText(/this action will permanently delete/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /delete app/i })).toBeEnabled();
  });

  it('confirms deletion and cancels via all dismissal triggers', async () => {
    const user = userEvent.setup();
    const onCancel = vi.fn();
    const onConfirm = vi.fn();

    render(
      <DeleteAppModal app={app} onCancel={onCancel} onConfirm={onConfirm} loading={false} />
    );

    await user.click(screen.getByRole('button', { name: /delete app/i }));
    expect(onConfirm).toHaveBeenCalledTimes(1);

    await user.click(screen.getByRole('button', { name: /cancel/i }));
    await user.click(screen.getByRole('button', { name: /close/i }));
    await user.click(screen.getByRole('presentation'));
    expect(onCancel).toHaveBeenCalledTimes(3);
  });

  it('disables actions and shows loading state while deleting', () => {
    render(
      <DeleteAppModal app={app} onCancel={() => {}} onConfirm={() => {}} loading={true} />
    );

    expect(screen.getByRole('button', { name: /cancel/i })).toBeDisabled();
    expect(screen.getByRole('button', { name: /deleting…/i })).toBeDisabled();
  });
});
