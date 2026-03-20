import '@testing-library/jest-dom';
import type {ReactNode} from 'react';

import {render, screen} from '@testing-library/react';

import Step1Content from '.';

jest.mock('@/app/hooks/useAdminTokenValidation', () => jest.fn());

jest.mock('@/app/hooks/useEmployerStepNavigation', () => jest.fn());

jest.mock('../../../components/MultiSelectWithTextStep', () => {
  return function MockMultiSelectWithTextStep({
    headerContent,
    showBackButton,
    stepNumber,
    stepTitle,
  }: {
    headerContent: ReactNode;
    stepNumber: number;
    stepTitle: string;
    showBackButton?: boolean;
  }) {
    return (
      <div data-testid="multi-select-step">
        <span data-testid="step-title">{stepTitle}</span>
        <span data-testid="step-number">{stepNumber}</span>
        <span data-testid="show-back-button">{String(showBackButton)}</span>
        <div data-testid="header-content">{headerContent}</div>
      </div>
    );
  };
});

jest.mock('../SelectedCompany', () => {
  return function MockSelectedCompany({companyName}: {companyName: string}) {
    return (
      <div data-testid="selected-company">
        <span data-testid="company-name">{companyName}</span>
      </div>
    );
  };
});

describe('Step1Content', () => {
  const DEFAULT_PROPS = {
    adminToken: 'test-admin-token',
    projectId: 'test-project-123',
  };

  beforeEach(() => {
    jest.clearAllMocks();

    const useStepNavigation = jest.requireMock(
      '@/app/hooks/useEmployerStepNavigation',
    );

    useStepNavigation.mockReturnValue({
      navigateToProject: jest.fn(),
    });
  });

  it('renders MultiSelectWithTextStep with the correct step title', () => {
    const useAdminTokenValidation = jest.requireMock(
      '@/app/hooks/useAdminTokenValidation',
    );

    useAdminTokenValidation.mockReturnValue({
      isValidating: false,
      project: null,
    });

    render(<Step1Content {...DEFAULT_PROPS} />);

    expect(screen.getByTestId('step-title')).toHaveTextContent(
      'Who you are today (Culture & Values)?',
    );
  });

  it('passes the correct stepNumber 1 to MultiSelectWithTextStep', () => {
    const useAdminTokenValidation = jest.requireMock(
      '@/app/hooks/useAdminTokenValidation',
    );

    useAdminTokenValidation.mockReturnValue({
      isValidating: false,
      project: null,
    });

    render(<Step1Content {...DEFAULT_PROPS} />);

    expect(screen.getByTestId('step-number')).toHaveTextContent('1');
  });

  it('calls useAdminTokenValidation with correct projectId and adminToken', () => {
    const useAdminTokenValidation = jest.requireMock(
      '@/app/hooks/useAdminTokenValidation',
    );

    useAdminTokenValidation.mockReturnValue({
      isValidating: false,
      project: null,
    });

    render(<Step1Content {...DEFAULT_PROPS} />);

    expect(useAdminTokenValidation).toHaveBeenCalledWith(
      'test-project-123',
      'test-admin-token',
    );
  });

  it('passes company name from project to SelectedCompany via headerContent', () => {
    const useAdminTokenValidation = jest.requireMock(
      '@/app/hooks/useAdminTokenValidation',
    );

    useAdminTokenValidation.mockReturnValue({
      isValidating: false,
      project: {
        company_name: 'Acme Corp',
        industry_name: 'Technology',
        location: 'Berlin',
        profile_image_url: null,
      },
    });

    render(<Step1Content {...DEFAULT_PROPS} />);

    expect(screen.getByTestId('company-name')).toHaveTextContent('Acme Corp');
  });

  it('passes empty string as company name when project is null', () => {
    const useAdminTokenValidation = jest.requireMock(
      '@/app/hooks/useAdminTokenValidation',
    );

    useAdminTokenValidation.mockReturnValue({
      isValidating: false,
      project: null,
    });

    render(<Step1Content {...DEFAULT_PROPS} />);

    expect(screen.getByTestId('company-name')).toHaveTextContent('');
  });
});
