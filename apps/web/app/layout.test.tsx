import '@testing-library/jest-dom';
import {render, screen} from '@testing-library/react';

import RootLayout, {metadata} from './layout';

describe('RootLayout', () => {
  it('should render children correctly', () => {
    render(
      <RootLayout>
        <div>Test Content</div>
      </RootLayout>,
    );

    expect(screen.getByText('Test Content')).toBeInTheDocument();
  });

  it('should render body element with children', () => {
    render(
      <RootLayout>
        <div data-testid="child-element">Test</div>
      </RootLayout>,
    );

    expect(screen.getByTestId('child-element')).toBeInTheDocument();
  });

  it('should render with multiple children', () => {
    render(
      <RootLayout>
        <div>First Child</div>
        <div>Second Child</div>
      </RootLayout>,
    );

    expect(screen.getByText('First Child')).toBeInTheDocument();
    expect(screen.getByText('Second Child')).toBeInTheDocument();
  });
});

describe('metadata', () => {
  it('should have correct title', () => {
    expect(metadata.title).toBe('EVP Architect');
  });

  it('should have correct description', () => {
    expect(metadata.description).toBe('Employee Value Proposition Architect');
  });
});
