import { render, screen } from '@testing-library/react';
import Card from './card.jsx';

describe('Card', () => {
  it('wraps provided children', () => {
    render(
      <Card>
        <p>Inside card</p>
      </Card>
    );

    expect(screen.getByText(/inside card/i)).toBeInTheDocument();
  });
});
