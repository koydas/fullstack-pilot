import { render, screen } from '@testing-library/react';
import AppHeader from './header.jsx';

describe('AppHeader', () => {
  it('shows branding title and subtitle', () => {
    render(<AppHeader />);

    expect(screen.getByText(/fullstack pilot/i)).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /app manager/i })).toBeInTheDocument();
  });
});
