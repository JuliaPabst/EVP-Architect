import '@testing-library/jest-dom';
import {render, screen} from '@testing-library/react';

import ProjectPage from './page';

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
        <a aria-label={label} href={href}>
          {motto}
        </a>
      </div>
    );
  };
});

describe('ProjectPage', () => {
  const mockParams = {
    projectId: 'test-project-123',
  };

  describe('Rendering', () => {
    it('should render without crashing', () => {
      render(<ProjectPage params={mockParams} />);

      expect(screen.getByTestId('header')).toBeInTheDocument();
    });

    it('should render the Header component', () => {
      render(<ProjectPage params={mockParams} />);

      const header = screen.getByTestId('header');

      expect(header).toBeInTheDocument();
    });

    it('should render HeaderLogo with correct props', () => {
      render(<ProjectPage params={mockParams} />);

      const headerLogo = screen.getByTestId('header-logo');

      expect(headerLogo).toBeInTheDocument();

      const link = screen.getByLabelText('Go to kununu');

      expect(link).toHaveAttribute('href', 'https://www.kununu.com/');
      expect(screen.getByText('Lets make work better.')).toBeInTheDocument();
    });

    it('should render main content area', () => {
      render(<ProjectPage params={mockParams} />);

      const main = screen.getByRole('main');

      expect(main).toBeInTheDocument();
    });

    it('should have proper main element styling', () => {
      render(<ProjectPage params={mockParams} />);

      const main = screen.getByRole('main');

      expect(main).toHaveStyle({padding: '2rem'});
    });
  });

  describe('Project ID Display', () => {
    it('should display the project ID in heading', () => {
      render(<ProjectPage params={mockParams} />);

      const heading = screen.getByRole('heading', {level: 1});

      expect(heading).toHaveTextContent('Project: test-project-123');
    });

    it('should display different project IDs correctly', () => {
      const differentParams = {projectId: 'another-project-456'};

      render(<ProjectPage params={differentParams} />);

      expect(
        screen.getByText('Project: another-project-456'),
      ).toBeInTheDocument();
    });

    it('should handle UUID format project IDs', () => {
      const uuidParams = {
        projectId: '550e8400-e29b-41d4-a716-446655440000',
      };

      render(<ProjectPage params={uuidParams} />);

      expect(
        screen.getByText('Project: 550e8400-e29b-41d4-a716-446655440000'),
      ).toBeInTheDocument();
    });

    it('should handle project IDs with special characters', () => {
      const specialParams = {projectId: 'project_test-123.v2'};

      render(<ProjectPage params={specialParams} />);

      expect(
        screen.getByText('Project: project_test-123.v2'),
      ).toBeInTheDocument();
    });
  });

  describe('Content Display', () => {
    it('should display project description text', () => {
      render(<ProjectPage params={mockParams} />);

      expect(
        screen.getByText(
          'This is the project page. Project details will be displayed here.',
        ),
      ).toBeInTheDocument();
    });

    it('should render paragraph element for description', () => {
      render(<ProjectPage params={mockParams} />);

      const paragraph = screen.getByText(
        'This is the project page. Project details will be displayed here.',
      );

      expect(paragraph.tagName).toBe('P');
    });
  });

  describe('Layout Structure', () => {
    it('should have proper HTML structure', () => {
      const {container} = render(<ProjectPage params={mockParams} />);

      // Check for div wrapper
      expect(container.firstChild?.nodeName).toBe('DIV');

      // Check for header
      expect(screen.getByTestId('header')).toBeInTheDocument();

      // Check for main
      expect(screen.getByRole('main')).toBeInTheDocument();
    });

    it('should have header before main content', () => {
      const {container} = render(<ProjectPage params={mockParams} />);

      const children = Array.from(container.firstChild?.childNodes || []);
      const elements = children.filter(node => node.nodeType === 1);

      expect(elements[0] as Element).toHaveAttribute('data-testid', 'header');
      expect((elements[1] as Element).tagName).toBe('MAIN');
    });
  });

  describe('Semantic HTML', () => {
    it('should use h1 for page title', () => {
      render(<ProjectPage params={mockParams} />);

      const heading = screen.getByRole('heading', {level: 1});

      expect(heading).toBeInTheDocument();
    });

    it('should use semantic main element', () => {
      render(<ProjectPage params={mockParams} />);

      const main = screen.getByRole('main');

      expect(main.tagName).toBe('MAIN');
    });
  });

  describe('Client Component', () => {
    it('should be a client component', () => {
      // This test verifies that the component can be rendered
      // Client components use hooks and browser APIs
      expect(() => render(<ProjectPage params={mockParams} />)).not.toThrow();
    });
  });

  describe('Props Handling', () => {
    it('should handle params prop correctly', () => {
      const params = {projectId: 'dynamic-id'};

      render(<ProjectPage params={params} />);

      expect(screen.getByText('Project: dynamic-id')).toBeInTheDocument();
    });

    it('should handle empty project ID', () => {
      const emptyParams = {projectId: ''};

      render(<ProjectPage params={emptyParams} />);

      // Should still render, just with empty project ID
      expect(screen.getByText('Project:')).toBeInTheDocument();
    });

    it('should handle numeric project IDs', () => {
      const numericParams = {projectId: '12345'};

      render(<ProjectPage params={numericParams} />);

      expect(screen.getByText('Project: 12345')).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('should handle very long project IDs', () => {
      const longId = 'a'.repeat(200);
      const longParams = {projectId: longId};

      render(<ProjectPage params={longParams} />);

      expect(screen.getByText(`Project: ${longId}`)).toBeInTheDocument();
    });

    it('should handle project IDs with spaces', () => {
      const spaceParams = {projectId: 'project with spaces'};

      render(<ProjectPage params={spaceParams} />);

      expect(
        screen.getByText('Project: project with spaces'),
      ).toBeInTheDocument();
    });

    it('should handle project IDs with URL-encoded characters', () => {
      const encodedParams = {projectId: 'project%20test'};

      render(<ProjectPage params={encodedParams} />);

      expect(screen.getByText('Project: project%20test')).toBeInTheDocument();
    });
  });
});
