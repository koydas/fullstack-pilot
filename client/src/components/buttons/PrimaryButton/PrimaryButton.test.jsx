import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import PrimaryButton from './PrimaryButton.jsx';

describe('PrimaryButton', () => {
  it('renders its children', () => {
    render(<PrimaryButton>Click me</PrimaryButton>);

    expect(screen.getByRole('button', { name: /click me/i })).toBeInTheDocument();
  });

  it('passes props to the underlying button', async () => {
    const user = userEvent.setup();
    const handleClick = vi.fn();

    render(
      <PrimaryButton type="submit" onClick={handleClick} disabled>
        Save
      </PrimaryButton>
    );

    const button = screen.getByRole('button', { name: /save/i });
    expect(button).toBeDisabled();

    await user.click(button);
    expect(handleClick).not.toHaveBeenCalled();
  });
});
