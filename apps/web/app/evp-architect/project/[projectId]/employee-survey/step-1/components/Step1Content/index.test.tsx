import '@testing-library/jest-dom';
import type {ReactNode} from 'react';

import {render, screen} from '@testing-library/react';

import Step1Content from '.';

jest.mock('@/app/hooks/useEmployeeStepNavigation', () => jest.fn());

jest.mock('@/app/hooks/useProjectInfo', () => jest.fn());

jest.mock('../../../components/MultiSelectStep', () => {
  return function MockMultiSelectStep({
    headerContent,
    showBackButton,
    stepNumber,
    stepTitle,
  }: {
    stepNumber: number;
    stepTitle: string;
    headerContent?: ReactNode;
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

jest.mock('@/app/components/survey/SelectedCompany', () => {
  return function MockSelectedCompany({
    companyName,
    location,
    logoUrl,
  }: {
    companyName: string;
    location?: string;
    logoUrl?: string;
  }) {
    return (
      <div data-testid="selected-company">
        <span data-testid="company-name">{companyName}</span>
        {location && <span data-testid="company-location">{location}</span>}
        {logoUrl && <span data-testid="company-logo">{logoUrl}</span>}
      </div>
    );
  };
});

describe('Step1Content', () => {
  const DEFAULT_PROPS = {projectId: 'test-project-123'};

  beforeEach(() => {
    jest.clearAllMocks();

    const useStepNavigation = jest.requireMock(
      '@/app/hooks/useEmployeeStepNavigation',
    );

    useStepNavigation.mockReturnValue({
      navigateToPreviousStep: jest.fn(),
    });
  });

  it('renders MultiSelectStep with stepTitle "Gelebte Werte"', () => {
    const useProjectInfo = jest.requireMock('@/app/hooks/useProjectInfo');

    useProjectInfo.mockReturnValue({isLoading: false, projectInfo: null});

    render(<Step1Content {...DEFAULT_PROPS} />);

    expect(screen.getByTestId('step-title')).toHaveTextContent('Gelebte Werte');
  });

  it('renders MultiSelectStep with stepNumber 1', () => {
    const useProjectInfo = jest.requireMock('@/app/hooks/useProjectInfo');

    useProjectInfo.mockReturnValue({isLoading: false, projectInfo: null});

    render(<Step1Content {...DEFAULT_PROPS} />);

    expect(screen.getByTestId('step-number')).toHaveTextContent('1');
  });

  it('passes showBackButton=false to MultiSelectStep', () => {
    const useProjectInfo = jest.requireMock('@/app/hooks/useProjectInfo');

    useProjectInfo.mockReturnValue({isLoading: false, projectInfo: null});

    render(<Step1Content {...DEFAULT_PROPS} />);

    expect(screen.getByTestId('show-back-button')).toHaveTextContent('false');
  });

  it('passes company name from projectInfo to SelectedCompany via headerContent', () => {
    const useProjectInfo = jest.requireMock('@/app/hooks/useProjectInfo');

    useProjectInfo.mockReturnValue({
      isLoading: false,
      projectInfo: {
        company_name: 'Acme Corp',
        location: 'Munich',
        profile_image_url: null,
      },
    });

    render(<Step1Content {...DEFAULT_PROPS} />);

    expect(screen.getByTestId('company-name')).toHaveTextContent('Acme Corp');
  });

  it('passes empty string as company name when projectInfo is null', () => {
    const useProjectInfo = jest.requireMock('@/app/hooks/useProjectInfo');

    useProjectInfo.mockReturnValue({isLoading: false, projectInfo: null});

    render(<Step1Content {...DEFAULT_PROPS} />);

    expect(screen.getByTestId('company-name')).toHaveTextContent('');
  });

  it('passes location to SelectedCompany when projectInfo has a location', () => {
    const useProjectInfo = jest.requireMock('@/app/hooks/useProjectInfo');

    useProjectInfo.mockReturnValue({
      isLoading: false,
      projectInfo: {
        company_name: 'Beta GmbH',
        location: 'Berlin',
        profile_image_url: null,
      },
    });

    render(<Step1Content {...DEFAULT_PROPS} />);

    expect(screen.getByTestId('company-location')).toHaveTextContent('Berlin');
  });

  it('calls useProjectInfo with the correct projectId', () => {
    const useProjectInfo = jest.requireMock('@/app/hooks/useProjectInfo');

    useProjectInfo.mockReturnValue({isLoading: false, projectInfo: null});

    render(<Step1Content {...DEFAULT_PROPS} />);

    expect(useProjectInfo).toHaveBeenCalledWith('test-project-123');
  });
});
