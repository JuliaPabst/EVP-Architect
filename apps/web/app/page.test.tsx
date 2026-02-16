import {render, screen} from '@testing-library/react';

import Home from './page';

describe('Home', () => {
  it('should render Hello World', () => {
    render(<Home />);

    expect(screen.getByText('Hello World')).toBeInTheDocument();
  });

  it('should render Hello World in a div', () => {
    render(<Home />);

    const element = screen.getByText('Hello World');

    expect(element.tagName).toBe('DIV');
  });
});
