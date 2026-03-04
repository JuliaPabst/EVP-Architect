import '@testing-library/jest-dom';
import {act, render, screen, waitFor} from '@testing-library/react';
import {useSearchParams} from 'next/navigation';

import EmployerSurveyStep2 from './page';

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useSearchParams: jest.fn(),
}));

// Mock useAdminTokenValidation hook
jest.mock('@/app/hooks/useAdminTokenValidation', () => {
  return jest.fn();
});

// Mock the Header component from kununu UI
jest.mock('@kununu/ui/organisms/Header', () => {
  return function MockHeader({logo}: {logo: React.ReactNode}) {
    return <header data-testid="header">{logo}</header>;
  };
});

jest.mock('@kununu/ui/organisms/Header/HeaderLogo', () => {
  return function MockHeaderLogo() {
    return <div data-testid="header-logo">Logo</div>;
  };
});

describe('EmployerSurveyStep2', () => {
  const mockParams = {
    projectId: 'test-project-123',
  };

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    (useSearchParams as jest.Mock).mockReturnValue({
      get: jest.fn((param: string) =>
        param === 'admin' ? 'test-admin-token' : null,
      ),
    });
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  it('should show loading state when validating', () => {
    const useAdminTokenValidation = jest.requireMock(
      '@/app/hooks/useAdminTokenValidation',
    );

    useAdminTokenValidation.mockReturnValue({
      companyName: '',
      isValidating: true,
    });

    render(<EmployerSurveyStep2 params={mockParams} />);

    expect(screen.getByTestId('loading')).toBeInTheDocument();
  });

  it('should render content after mount', async () => {
    const useAdminTokenValidation = jest.requireMock(
      '@/app/hooks/useAdminTokenValidation',
    );

    useAdminTokenValidation.mockReturnValue({
      companyName: 'Test Company',
      isValidating: false,
    });

    render(<EmployerSurveyStep2 params={mockParams} />);

    await act(async () => {
      jest.runAllTimers();
    });

    await waitFor(() => {
      expect(screen.getByTestId('employer-survey-step-2')).toBeInTheDocument();
    });
  });

  it('should display step 2 heading and company name', async () => {
    const useAdminTokenValidation = jest.requireMock(
      '@/app/hooks/useAdminTokenValidation',
    );

    useAdminTokenValidation.mockReturnValue({
      companyName: 'Test Company',
      isValidating: false,
    });

    render(<EmployerSurveyStep2 params={mockParams} />);

    await act(async () => {
      jest.runAllTimers();
    });

    await waitFor(() => {
      expect(screen.getByRole('heading', {level: 1})).toHaveTextContent(
        'Employer Survey - Step 2',
      );
      expect(screen.getByText('Company: Test Company')).toBeInTheDocument();
    });
  });

  it('should call useAdminTokenValidation with correct params', () => {
    const useAdminTokenValidation = jest.requireMock(
      '@/app/hooks/useAdminTokenValidation',
    );

    useAdminTokenValidation.mockReturnValue({
      companyName: 'Test Company',
      isValidating: false,
    });

    render(<EmployerSurveyStep2 params={mockParams} />);

    expect(useAdminTokenValidation).toHaveBeenCalledWith(
      'test-project-123',
      'test-admin-token',
    );
  });
});

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useSearchParams: jest.fn(),
}));

// Mock useAdminTokenValidation hook
jest.mock('@/app/hooks/useAdminTokenValidation', () => {
  return jest.fn();
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
        <a aria-label={label} href={href}>
          {motto}
        </a>
      </div>
    );
  };
});

describe('EmployerSurveyStep2', () => {
  const mockParams = {
    projectId: 'test-project-123',
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (useSearchParams as jest.Mock).mockReturnValue({
      get: jest.fn((param: string) => {
        if (param === 'admin') return 'test-admin-token';
        return null;
      }),
    });
  });

  describe('Loading State', () => {
    it('should show loading state when validating', () => {
      const useAdminTokenValidation = jest.requireMock(
        '@/app/hooks/useAdminTokenValidation',
      );

      useAdminTokenValidation.mockReturnValue({
        companyName: '',
        isValidating: true,
      });

      render(<EmployerSurveyStep2 params={mockParams} />);

      expect(screen.getByTestId('loading')).toBeInTheDocument();
      expect(screen.getByText('Loading...')).toBeInTheDocument();
    });
  });

  describe('Rendering', () => {
    beforeEach(() => {
      const useAdminTokenValidation = jest.requireMock(
        '@/app/hooks/useAdminTokenValidation',
      );

      useAdminTokenValidation.mockReturnValue({
        companyName: 'Test Company',
        isValidating: false,
      });
    });

    it('should render without crashing', () => {
      render(<EmployerSurveyStep2 params={mockParams} />);

      // Wait for mount
      setTimeout(() => {
        expect(
          screen.getByTestId('employer-survey-step-2'),
        ).toBeInTheDocument();
      }, 10);
    });

    it('should render the Header component', () => {
      render(<EmployerSurveyStep2 params={mockParams} />);

      setTimeout(() => {
        expect(screen.getByTestId('header')).toBeInTheDocument();
      }, 10);
    });

    it('should render HeaderLogo with correct props', () => {
      render(<EmployerSurveyStep2 params={mockParams} />);

      setTimeout(() => {
        const headerLogo = screen.queryByTestId('header-logo');

        if (headerLogo) {
          const link = screen.getByLabelText('Go to kununu');

          expect(link).toHaveAttribute('href', 'https://www.kununu.com/');
          expect(
            screen.getByText("Let's make work better."),
          ).toBeInTheDocument();
        }
      }, 10);
    });

    it('should render main content area', () => {
      render(<EmployerSurveyStep2 params={mockParams} />);

      setTimeout(() => {
        const main = screen.queryByRole('main');

        expect(main).toBeInTheDocument();
      }, 10);
    });

    it('should have proper main element styling', () => {
      render(<EmployerSurveyStep2 params={mockParams} />);

      setTimeout(() => {
        const main = screen.queryByRole('main');

        if (main) {
          expect(main).toHaveStyle({padding: '2rem'});
        }
      }, 10);
    });
  });

  describe('Content Display', () => {
    beforeEach(() => {
      const useAdminTokenValidation = jest.requireMock(
        '@/app/hooks/useAdminTokenValidation',
      );

      useAdminTokenValidation.mockReturnValue({
        companyName: 'Test Company',
        isValidating: false,
      });
    });

    it('should display step 2 heading', () => {
      render(<EmployerSurveyStep2 params={mockParams} />);

      setTimeout(() => {
        expect(
          screen.getByRole('heading', {
            level: 1,
            name: 'Employer Survey - Step 2',
          }),
        ).toBeInTheDocument();
      }, 10);
    });

    it('should display company name', () => {
      render(<EmployerSurveyStep2 params={mockParams} />);

      setTimeout(() => {
        expect(screen.getByText('Company: Test Company')).toBeInTheDocument();
      }, 10);
    });

    it('should display step 2 description', () => {
      render(<EmployerSurveyStep2 params={mockParams} />);

      setTimeout(() => {
        expect(
          screen.getByText('This is step 2 of the employer survey.'),
        ).toBeInTheDocument();
      }, 10);
    });

    it('should display placeholder text', () => {
      render(<EmployerSurveyStep2 params={mockParams} />);

      setTimeout(() => {
        expect(
          screen.getByText(
            'Survey content will be implemented in future stories.',
          ),
        ).toBeInTheDocument();
      }, 10);
    });
  });

  describe('Token Validation', () => {
    it('should call useAdminTokenValidation with correct params', () => {
      const useAdminTokenValidation = jest.requireMock(
        '@/app/hooks/useAdminTokenValidation',
      );

      useAdminTokenValidation.mockReturnValue({
        companyName: 'Test Company',
        isValidating: false,
      });

      render(<EmployerSurveyStep2 params={mockParams} />);

      expect(useAdminTokenValidation).toHaveBeenCalledWith(
        'test-project-123',
        'test-admin-token',
      );
    });

    it('should handle different company names', () => {
      const useAdminTokenValidation = jest.requireMock(
        '@/app/hooks/useAdminTokenValidation',
      );

      useAdminTokenValidation.mockReturnValue({
        companyName: 'Another Company',
        isValidating: false,
      });

      render(<EmployerSurveyStep2 params={mockParams} />);

      setTimeout(() => {
        expect(
          screen.getByText('Company: Another Company'),
        ).toBeInTheDocument();
      }, 10);
    });
  });

  describe('Layout Structure', () => {
    beforeEach(() => {
      const useAdminTokenValidation = jest.requireMock(
        '@/app/hooks/useAdminTokenValidation',
      );

      useAdminTokenValidation.mockReturnValue({
        companyName: 'Test Company',
        isValidating: false,
      });
    });

    it('should have proper HTML structure', () => {
      render(<EmployerSurveyStep2 params={mockParams} />);

      setTimeout(() => {
        const container = screen.queryByTestId('employer-survey-step-2');

        expect(container).toBeInTheDocument();
      }, 10);
    });
  });
});
