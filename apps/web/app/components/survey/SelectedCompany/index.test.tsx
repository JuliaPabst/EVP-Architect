import '@testing-library/jest-dom';
import {render, screen} from '@testing-library/react';

import SelectedCompany from '.';

jest.mock(
  '@kununu/ui/particles/Icons/System/Location',
  () =>
    function MockLocation() {
      return null;
    },
);

jest.mock(
  '@kununu/ui/particles/Icons/System/OfficeBlock',
  () =>
    function MockOfficeBlock() {
      return null;
    },
);

describe('SelectedCompany', () => {
  it('renders the company name', () => {
    render(<SelectedCompany companyName="Acme Corp" />);

    expect(screen.getByText('Acme Corp')).toBeInTheDocument();
  });

  it('renders the location when provided', () => {
    render(
      <SelectedCompany companyName="Acme Corp" location="Berlin, Germany" />,
    );

    expect(screen.getByText('Berlin, Germany')).toBeInTheDocument();
  });

  it('does NOT render the location row when location is not provided', () => {
    render(<SelectedCompany companyName="Acme Corp" />);

    expect(screen.queryByText('Berlin, Germany')).not.toBeInTheDocument();
  });

  it('renders the industry when provided', () => {
    render(<SelectedCompany companyName="Acme Corp" industry="Technology" />);

    expect(screen.getByText('Technology')).toBeInTheDocument();
  });

  it('does NOT render the industry row when industry is not provided', () => {
    render(<SelectedCompany companyName="Acme Corp" />);

    expect(screen.queryByText('Technology')).not.toBeInTheDocument();
  });

  it('renders logo img with correct src and alt when logoUrl is provided', () => {
    render(
      <SelectedCompany
        companyName="Acme Corp"
        logoUrl="https://example.com/logo.png"
      />,
    );

    const img = screen.getByRole('img', {name: 'Acme Corp logo'});

    expect(img).toBeInTheDocument();
    expect(img).toHaveAttribute('src', 'https://example.com/logo.png');
    expect(img).toHaveAttribute('alt', 'Acme Corp logo');
  });

  it('does NOT render the logo when logoUrl is not provided', () => {
    render(<SelectedCompany companyName="Acme Corp" />);

    expect(screen.queryByRole('img')).not.toBeInTheDocument();
  });
});
