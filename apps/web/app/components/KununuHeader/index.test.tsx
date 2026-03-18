import '@testing-library/jest-dom';
import {render, screen} from '@testing-library/react';

import KununuHeader from '.';

jest.mock(
  '@kununu/ui/organisms/Header',
  () =>
    function MockHeader({logo}: {logo: React.ReactNode}) {
      return <header data-testid="header">{logo}</header>;
    },
);

jest.mock(
  '@kununu/ui/organisms/Header/HeaderLogo',
  () =>
    function MockHeaderLogo({
      href,
      label,
      motto,
    }: {
      href: string;
      label: string;
      motto: string;
    }) {
      return (
        <div>
          <a aria-label={label} href={href}>
            {motto}
          </a>
        </div>
      );
    },
);

describe('KununuHeader', () => {
  it('renders the header', () => {
    render(<KununuHeader />);

    expect(screen.getByTestId('header')).toBeInTheDocument();
  });

  it('renders logo link pointing to https://www.kununu.com/', () => {
    render(<KununuHeader />);

    expect(screen.getByRole('link', {name: 'Go to kununu'})).toHaveAttribute(
      'href',
      'https://www.kununu.com/',
    );
  });

  it('renders the motto "Let\'s make work better."', () => {
    render(<KununuHeader />);

    expect(screen.getByText("Let's make work better.")).toBeInTheDocument();
  });

  it('link has aria-label "Go to kununu"', () => {
    render(<KununuHeader />);

    expect(screen.getByRole('link', {name: 'Go to kununu'})).toHaveAttribute(
      'aria-label',
      'Go to kununu',
    );
  });
});
