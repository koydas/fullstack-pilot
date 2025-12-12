import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import CreationApp from './creation-app.jsx';

describe('CreationApp', () => {
  it('shows the current name and triggers change handler', async () => {
    const user = userEvent.setup();
    const handleChange = vi.fn();

    render(
      <CreationApp
        name="My app"
        onNameChange={handleChange}
        onSubmit={vi.fn()}
        loading={false}
        error=""
      />
    );

    const input = screen.getByLabelText(/app name/i);
    expect(input).toHaveValue('My app');

    await user.type(input, '!');
    expect(handleChange).toHaveBeenCalled();
  });

  it('disables fields while loading and prevents submitting empty names', async () => {
    const user = userEvent.setup();
    const handleSubmit = vi.fn((event) => event.preventDefault());

    render(
      <CreationApp
        name=""
        onNameChange={vi.fn()}
        onSubmit={handleSubmit}
        loading
        error=""
      />
    );

    const button = screen.getByRole('button', { name: /add app/i });
    const input = screen.getByLabelText(/app name/i);

    expect(button).toBeDisabled();
    expect(input).toBeDisabled();

    await user.click(button);
    expect(handleSubmit).not.toHaveBeenCalled();
  });

  it('shows an error when provided', () => {
    render(
      <CreationApp
        name="Demo"
        onNameChange={vi.fn()}
        onSubmit={vi.fn()}
        loading={false}
        error="Could not create app"
      />
    );

    expect(screen.getByText(/could not create app/i)).toBeInTheDocument();
  });
});
