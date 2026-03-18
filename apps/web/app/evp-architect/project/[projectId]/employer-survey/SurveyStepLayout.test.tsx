import '@testing-library/jest-dom';
import {act, render, screen} from '@testing-library/react';
import {useSearchParams} from 'next/navigation';

import SurveyStepLayout from './SurveyStepLayout';

jest.mock('next/navigation', () => ({
  useRouter: jest.fn(() => ({push: jest.fn()})),
  useSearchParams: jest.fn(),
}));

jest.mock('@/app/hooks/useAdminTokenValidation', () => jest.fn());

jest.mock('@/app/components/KununuHeader', () => {
  return function MockKununuHeader() {
    return <header data-testid="header" />;
  };
});

describe('SurveyStepLayout', () => {
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

  it('shows loading on initial render before mounted state resolves', () => {
    const useAdminTokenValidation = jest.requireMock(
      '@/app/hooks/useAdminTokenValidation',
    );

    useAdminTokenValidation.mockReturnValue({
      companyName: 'Test Company',
      isValidating: false,
    });

    render(<SurveyStepLayout projectId="test-project-123" stepNumber={1} />);

    // Before timers run, mounted is false -> loading shown
    expect(screen.getByTestId('loading')).toBeInTheDocument();
    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  it('shows loading when isValidating is true even after mount', async () => {
    const useAdminTokenValidation = jest.requireMock(
      '@/app/hooks/useAdminTokenValidation',
    );

    useAdminTokenValidation.mockReturnValue({
      companyName: '',
      isValidating: true,
    });

    render(<SurveyStepLayout projectId="test-project-123" stepNumber={2} />);

    await act(async () => {
      jest.runAllTimers();
    });

    expect(screen.getByTestId('loading')).toBeInTheDocument();
  });

  it('renders step content after mount when not validating', async () => {
    const useAdminTokenValidation = jest.requireMock(
      '@/app/hooks/useAdminTokenValidation',
    );

    useAdminTokenValidation.mockReturnValue({
      companyName: 'Test Company',
      isValidating: false,
    });

    render(<SurveyStepLayout projectId="test-project-123" stepNumber={1} />);

    await act(async () => {
      jest.runAllTimers();
    });

    expect(screen.getByTestId('employer-survey-step-1')).toBeInTheDocument();
    expect(screen.queryByTestId('loading')).not.toBeInTheDocument();
  });

  it('shows company name after mount when not validating', async () => {
    const useAdminTokenValidation = jest.requireMock(
      '@/app/hooks/useAdminTokenValidation',
    );

    useAdminTokenValidation.mockReturnValue({
      companyName: 'Acme Corp',
      isValidating: false,
    });

    render(<SurveyStepLayout projectId="test-project-123" stepNumber={3} />);

    await act(async () => {
      jest.runAllTimers();
    });

    expect(screen.getByText('Company: Acme Corp')).toBeInTheDocument();
  });

  it('renders with the correct data-testid for the given step number', async () => {
    const useAdminTokenValidation = jest.requireMock(
      '@/app/hooks/useAdminTokenValidation',
    );

    useAdminTokenValidation.mockReturnValue({
      companyName: 'Test Company',
      isValidating: false,
    });

    render(<SurveyStepLayout projectId="test-project-123" stepNumber={4} />);

    await act(async () => {
      jest.runAllTimers();
    });

    expect(screen.getByTestId('employer-survey-step-4')).toBeInTheDocument();
  });
});
