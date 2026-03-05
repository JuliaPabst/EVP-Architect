import '@testing-library/jest-dom';
import {act, render, screen, waitFor} from '@testing-library/react';
import {useSearchParams} from 'next/navigation';

import EmployerSurveyStep4 from './page';

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

describe('EmployerSurveyStep4', () => {
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

    render(<EmployerSurveyStep4 params={mockParams} />);

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

    render(<EmployerSurveyStep4 params={mockParams} />);

    await act(async () => {
      jest.runAllTimers();
    });

    await waitFor(() => {
      expect(screen.getByTestId('employer-survey-step-4')).toBeInTheDocument();
    });
  });

  it('should display step 4 heading and company name', async () => {
    const useAdminTokenValidation = jest.requireMock(
      '@/app/hooks/useAdminTokenValidation',
    );

    useAdminTokenValidation.mockReturnValue({
      companyName: 'Test Company',
      isValidating: false,
    });

    render(<EmployerSurveyStep4 params={mockParams} />);

    await act(async () => {
      jest.runAllTimers();
    });

    await waitFor(() => {
      expect(screen.getByRole('heading', {level: 1})).toHaveTextContent(
        'Employer Survey - Step 4',
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

    render(<EmployerSurveyStep4 params={mockParams} />);

    expect(useAdminTokenValidation).toHaveBeenCalledWith(
      'test-project-123',
      'test-admin-token',
    );
  });
});
