import '@testing-library/jest-dom';
import {act, render, screen, waitFor} from '@testing-library/react';
import {useSearchParams} from 'next/navigation';

import EmployerSurveyStep1 from './page';

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

describe('EmployerSurveyStep1', () => {
  const mockParams = {
    projectId: 'test-project-123',
  };

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    (useSearchParams as jest.Mock).mockReturnValue({
      get: jest.fn((param: string) => {
        if (param === 'admin') return 'test-admin-token';
        return null;
      }),
    });
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
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

      render(<EmployerSurveyStep1 params={mockParams} />);

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

    it('should render content after mount', async () => {
      render(<EmployerSurveyStep1 params={mockParams} />);

      await act(async () => {
        jest.runAllTimers();
      });

      await waitFor(() => {
        expect(
          screen.getByTestId('employer-survey-step-1'),
        ).toBeInTheDocument();
      });
    });

    it('should render the Header component', async () => {
      render(<EmployerSurveyStep1 params={mockParams} />);

      await act(async () => {
        jest.runAllTimers();
      });

      await waitFor(() => {
        expect(screen.getByTestId('header')).toBeInTheDocument();
      });
    });

    it('should render HeaderLogo with correct props', async () => {
      render(<EmployerSurveyStep1 params={mockParams} />);

      await act(async () => {
        jest.runAllTimers();
      });

      await waitFor(() => {
        const link = screen.getByLabelText('Go to kununu');

        expect(link).toHaveAttribute('href', 'https://www.kununu.com/');
      });
    });

    it('should render main content area', async () => {
      render(<EmployerSurveyStep1 params={mockParams} />);

      await act(async () => {
        jest.runAllTimers();
      });

      await waitFor(() => {
        const main = screen.getByRole('main');

        expect(main).toBeInTheDocument();
      });
    });

    it('should have proper main element styling', async () => {
      render(<EmployerSurveyStep1 params={mockParams} />);

      await act(async () => {
        jest.runAllTimers();
      });

      await waitFor(() => {
        const main = screen.getByRole('main');

        expect(main).toHaveStyle({padding: '2rem'});
      });
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

    it('should display step 1 heading', async () => {
      render(<EmployerSurveyStep1 params={mockParams} />);

      await act(async () => {
        jest.runAllTimers();
      });

      await waitFor(() => {
        expect(screen.getByRole('heading', {level: 1})).toHaveTextContent(
          'Employer Survey - Step 1',
        );
      });
    });

    it('should display company name', async () => {
      render(<EmployerSurveyStep1 params={mockParams} />);

      await act(async () => {
        jest.runAllTimers();
      });

      await waitFor(() => {
        expect(screen.getByText('Company: Test Company')).toBeInTheDocument();
      });
    });

    it('should display step 1 description', async () => {
      render(<EmployerSurveyStep1 params={mockParams} />);

      await act(async () => {
        jest.runAllTimers();
      });

      await waitFor(() => {
        expect(
          screen.getByText('This is step 1 of the employer survey.'),
        ).toBeInTheDocument();
      });
    });

    it('should display placeholder text', async () => {
      render(<EmployerSurveyStep1 params={mockParams} />);

      await act(async () => {
        jest.runAllTimers();
      });

      await waitFor(() => {
        expect(
          screen.getByText(
            'Survey content will be implemented in future stories.',
          ),
        ).toBeInTheDocument();
      });
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

      render(<EmployerSurveyStep1 params={mockParams} />);

      expect(useAdminTokenValidation).toHaveBeenCalledWith(
        'test-project-123',
        'test-admin-token',
      );
    });

    it('should handle different company names', async () => {
      const useAdminTokenValidation = jest.requireMock(
        '@/app/hooks/useAdminTokenValidation',
      );

      useAdminTokenValidation.mockReturnValue({
        companyName: 'Another Company',
        isValidating: false,
      });

      render(<EmployerSurveyStep1 params={mockParams} />);

      await act(async () => {
        jest.runAllTimers();
      });

      await waitFor(() => {
        expect(
          screen.getByText('Company: Another Company'),
        ).toBeInTheDocument();
      });
    });
  });
});
