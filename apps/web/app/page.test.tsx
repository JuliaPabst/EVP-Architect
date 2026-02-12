import {render, screen} from '@testing-library/react';

import Home from './page';

describe('Home', () => {
  it('should render Hello World', () => {
    render(<Home />);

    expect(screen.getByText('Hello World')).toBeInTheDocument();
  });
});
