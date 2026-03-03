import '@testing-library/jest-dom';
import {render, screen} from '@testing-library/react';

import EvpArchitect from './page';

// Mock the child components
jest.mock('../components/StartPage/SearchHeader', () => {
  return function MockSearchHeader() {
    return <div data-testid="search-header">Search Header</div>;
  };
});

jest.mock('../components/StartPage/SelectedTopicsModule', () => {
  return function MockSelectedTopicsModule() {
    return <div data-testid="selected-topics-module">Selected Topics Module</div>;
  };
});

// Mock the Header component from kununu UI
jest.mock('@kununu/ui/organisms/Header', () => {
  return function MockHeader({logo}: {logo: React.ReactNode}) {
    return <header data-testid="header">{logo}</header>;
  };
});

jest.mock('@kununu/ui/organisms/Header/HeaderLogo', () => {
  return function MockHeaderLogo({
    href,
    label,
    motto,
  }: {
    href: string;
    label: string;
    motto: string;
  }) {
    return (
      <div data-testid="header-logo">
        <a href={href} aria-label={label}>
          {motto}
        </a>
      </div>
    );
  };
});

describe('EvpArchitect Page', () => {
  describe('Rendering', () => {
    it('should render without crashing', () => {
      render(<EvpArchitect />);
      
      expect(screen.getByTestId('header')).toBeInTheDocument();
    });

    it('should render the Header component', () => {
      render(<EvpArchitect />);
      
      const header = screen.getByTestId('header');
      expect(header).toBeInTheDocument();
    });

    it('should render HeaderLogo with correct props', () => {
      render(<EvpArchitect />);
      
      const headerLogo = screen.getByTestId('header-logo');
      expect(headerLogo).toBeInTheDocument();
      
      const link = screen.getByLabelText('Go to kununu');
      expect(link).toHaveAttribute('href', 'https://www.kununu.com/');
      expect(screen.getByText('Lets make work better.')).toBeInTheDocument();
    });

    it('should render SearchHeader component', () => {
      render(<EvpArchitect />);
      
      expect(screen.getByTestId('search-header')).toBeInTheDocument();
    });

    it('should render SelectedTopicsModule component', () => {
      render(<EvpArchitect />);
      
      expect(screen.getByTestId('selected-topics-module')).toBeInTheDocument();
    });
  });

  describe('Component Order', () => {
    it('should render components in correct order', () => {
      const {container} = render(<EvpArchitect />);
      
      const children = Array.from(container.firstChild?.childNodes || []);
      const testIds = children
        .map((node) => {
          if (node.nodeType === 1) {
            // Element node
            return (node as Element).getAttribute('data-testid');
          }
          return null;
        })
        .filter(Boolean);

      expect(testIds[0]).toBe('header');
      expect(testIds[1]).toBe('search-header');
      expect(testIds[2]).toBe('selected-topics-module');
    });
  });

  describe('Layout Structure', () => {
    it('should have a wrapper div', () => {
      const {container} = render(<EvpArchitect />);
      
      expect(container.firstChild?.nodeName).toBe('DIV');
    });

    it('should contain all main sections', () => {
      render(<EvpArchitect />);
      
      expect(screen.getByTestId('header')).toBeInTheDocument();
      expect(screen.getByTestId('search-header')).toBeInTheDocument();
      expect(screen.getByTestId('selected-topics-module')).toBeInTheDocument();
    });
  });

  describe('Integration', () => {
    it('should render all child components together', () => {
      render(<EvpArchitect />);
      
      // All components should be present
      expect(screen.getByTestId('header')).toBeInTheDocument();
      expect(screen.getByTestId('search-header')).toBeInTheDocument();
      expect(screen.getByTestId('selected-topics-module')).toBeInTheDocument();
      
      // Check content from mocked components
      expect(screen.getByText('Search Header')).toBeInTheDocument();
      expect(screen.getByText('Selected Topics Module')).toBeInTheDocument();
    });
  });

  describe('Client Component', () => {
    it('should be a client component', () => {
      // This test verifies that the component can be rendered
      // Client components use hooks and browser APIs
      expect(() => render(<EvpArchitect />)).not.toThrow();
    });
  });
});
