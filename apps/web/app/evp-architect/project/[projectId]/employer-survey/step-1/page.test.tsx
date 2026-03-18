import '@testing-library/jest-dom';
import {act, render, screen, waitFor} from '@testing-library/react';
import {useSearchParams} from 'next/navigation';

import EmployerSurveyStep1 from './page';

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(() => ({push: jest.fn(), replace: jest.fn()})),
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
        expect(screen.getByRole('main')).toBeInTheDocument();
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

    it('should have proper main element', async () => {
      render(<EmployerSurveyStep1 params={mockParams} />);

      await act(async () => {
        jest.runAllTimers();
      });

      await waitFor(() => {
        const main = screen.getByRole('main');

        expect(main).toBeInTheDocument();
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
          'Who you are today (Culture & Values)?',
        );
      });
    });

    it('should render the header', async () => {
      render(<EmployerSurveyStep1 params={mockParams} />);

      await act(async () => {
        jest.runAllTimers();
      });

      await waitFor(() => {
        expect(screen.getByTestId('header')).toBeInTheDocument();
      });
    });

    it('should render the main content area', async () => {
      render(<EmployerSurveyStep1 params={mockParams} />);

      await act(async () => {
        jest.runAllTimers();
      });

      await waitFor(() => {
        expect(screen.getByRole('main')).toBeInTheDocument();
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

    it('should render with different validation states', async () => {
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
        expect(screen.getByTestId('header')).toBeInTheDocument();
      });
    });
  });
});
