import '@testing-library/jest-dom';
import type {ReactNode} from 'react';

import {fireEvent, render, screen, waitFor} from '@testing-library/react';

import MultiSelectStep from '.';

jest.mock('@/app/hooks/useEmployeeSurveyStep', () => jest.fn());

jest.mock('@/app/hooks/useSurveyStepState', () => jest.fn());

jest.mock('@/app/hooks/useEmployeeStepNavigation', () => jest.fn());

jest.mock('@/app/components/survey/FocusSelection', () => {
  return function MockFocusSelection({title}: {title: string}) {
    return <div data-testid="focus-selection">{title}</div>;
  };
});

jest.mock('@/app/components/survey/TextSection', () => {
  return function MockTextSection({title}: {title: string}) {
    return <div data-testid="text-section">{title}</div>;
  };
});

jest.mock('@/app/components/survey/NavigationButtons', () => {
  return function MockNavigationButtons({
    canContinue,
    onContinue,
    showBackButton,
  }: {
    canContinue: boolean;
    onContinue?: () => void;
    showBackButton?: boolean;
  }) {
    return (
      <button
        data-can-continue={String(canContinue)}
        data-show-back={String(showBackButton)}
        disabled={!canContinue}
        onClick={onContinue}
        type="button"
      >
        Continue
      </button>
    );
  };
});

jest.mock('@/app/components/survey/StepContentLayout', () => {
  return function MockStepContentLayout({
    children,
    error,
    isLoading,
    stepTitle,
  }: {
    children: ReactNode;
    isLoading: boolean;
    stepTitle: string;
    error?: string | null;
  }) {
    if (isLoading) {
      return <div data-testid="loading">Loading</div>;
    }
    if (error && !isLoading) {
      return <div data-testid="error">{error}</div>;
    }
    return (
      <div>
        <span data-testid="step-title">{stepTitle}</span>
        {children}
      </div>
    );
  };
});

const MOCK_MULTI_SELECT_QUESTION = {
  id: 'ms-q1',
  options: [
    {label: 'Option One', value_key: 'opt-1'},
    {label: 'Option Two', value_key: 'opt-2'},
  ],
  prompt: 'Select your lived values',
  question_type: 'multi_select',
  selection_limit: 5,
};

const MOCK_TEXT_QUESTION = {
  id: 'txt-q1',
  prompt: 'Any additional thoughts?',
  question_type: 'text',
};

const MOCK_STEP_DATA_WITH_TEXT = {
  questions: [MOCK_MULTI_SELECT_QUESTION, MOCK_TEXT_QUESTION],
};

const MOCK_STEP_DATA_WITHOUT_TEXT = {
  questions: [MOCK_MULTI_SELECT_QUESTION],
};

function setupMocks({
  additionalContext = '',
  error = null,
  isLoading = false,
  isSaving = false,
  saveAnswers = jest.fn().mockResolvedValue(true),
  selectedFactors = [],
  stepData = null,
}: {
  additionalContext?: string;
  error?: string | null;
  isLoading?: boolean;
  isSaving?: boolean;
  saveAnswers?: jest.Mock;
  selectedFactors?: string[];
  stepData?: {
    questions: {
      id: string;
      prompt: string;
      question_type: string;
      options?: {label: string; value_key: string}[];
      selection_limit?: number;
    }[];
  } | null;
} = {}) {
  const useEmployeeSurveyStep = jest.requireMock(
    '@/app/hooks/useEmployeeSurveyStep',
  );
  const useSurveyStepState = jest.requireMock('@/app/hooks/useSurveyStepState');
  const useStepNavigation = jest.requireMock(
    '@/app/hooks/useEmployeeStepNavigation',
  );

  useEmployeeSurveyStep.mockReturnValue({
    error,
    isLoading,
    isSaving,
    saveAnswers,
    stepData,
  });

  useSurveyStepState.mockReturnValue({
    additionalContext,
    selectedFactors,
    setAdditionalContext: jest.fn(),
    setSelectedFactors: jest.fn(),
  });

  useStepNavigation.mockReturnValue({
    navigateToNextStep: jest.fn(),
  });
}

const DEFAULT_PROPS = {
  onBackNavigation: jest.fn(),
  projectId: 'test-project-123',
  stepNumber: 1,
  stepTitle: 'Lived Values',
};

describe('MultiSelectStep', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('shows error fallback when no stepData and not loading', () => {
    setupMocks({isLoading: false, stepData: null});

    render(<MultiSelectStep {...DEFAULT_PROPS} />);

    expect(
      screen.getByText('Failed to load survey questions'),
    ).toBeInTheDocument();
  });

  it('shows loading indicator when isLoading is true', () => {
    setupMocks({isLoading: true, stepData: null});

    render(<MultiSelectStep {...DEFAULT_PROPS} />);

    expect(screen.getByTestId('loading')).toBeInTheDocument();
  });

  it('renders FocusSelection with the question prompt when step data is available', () => {
    setupMocks({
      isLoading: false,
      selectedFactors: [],
      stepData: MOCK_STEP_DATA_WITHOUT_TEXT,
    });

    render(<MultiSelectStep {...DEFAULT_PROPS} />);

    expect(screen.getByTestId('focus-selection')).toBeInTheDocument();
    expect(screen.getByTestId('focus-selection')).toHaveTextContent(
      'Select your lived values',
    );
  });

  it('renders TextSection when a text question is present in step data', () => {
    setupMocks({
      isLoading: false,
      selectedFactors: ['opt-1'],
      stepData: MOCK_STEP_DATA_WITH_TEXT,
    });

    render(<MultiSelectStep {...DEFAULT_PROPS} />);

    expect(screen.getByTestId('text-section')).toBeInTheDocument();
    expect(screen.getByTestId('text-section')).toHaveTextContent(
      'Any additional thoughts?',
    );
  });

  it('does not render TextSection when no text question is present', () => {
    setupMocks({
      isLoading: false,
      selectedFactors: ['opt-1'],
      stepData: MOCK_STEP_DATA_WITHOUT_TEXT,
    });

    render(<MultiSelectStep {...DEFAULT_PROPS} />);

    expect(screen.queryByTestId('text-section')).not.toBeInTheDocument();
  });

  it('enables the Continue button when at least one factor is selected', () => {
    setupMocks({
      isLoading: false,
      isSaving: false,
      selectedFactors: ['opt-1'],
      stepData: MOCK_STEP_DATA_WITHOUT_TEXT,
    });

    render(<MultiSelectStep {...DEFAULT_PROPS} />);

    expect(screen.getByRole('button', {name: 'Continue'})).toBeEnabled();
    expect(screen.getByRole('button', {name: 'Continue'})).toHaveAttribute(
      'data-can-continue',
      'true',
    );
  });

  it('disables the Continue button when no factors are selected', () => {
    setupMocks({
      isLoading: false,
      isSaving: false,
      selectedFactors: [],
      stepData: MOCK_STEP_DATA_WITHOUT_TEXT,
    });

    render(<MultiSelectStep {...DEFAULT_PROPS} />);

    expect(screen.getByRole('button', {name: 'Continue'})).toBeDisabled();
    expect(screen.getByRole('button', {name: 'Continue'})).toHaveAttribute(
      'data-can-continue',
      'false',
    );
  });

  it('disables the Continue button while saving', () => {
    setupMocks({
      isLoading: false,
      isSaving: true,
      selectedFactors: ['opt-1'],
      stepData: MOCK_STEP_DATA_WITHOUT_TEXT,
    });

    render(<MultiSelectStep {...DEFAULT_PROPS} />);

    expect(screen.getByRole('button', {name: 'Continue'})).toBeDisabled();
  });

  it('renders headerContent when provided', () => {
    setupMocks({
      isLoading: false,
      selectedFactors: [],
      stepData: MOCK_STEP_DATA_WITHOUT_TEXT,
    });

    render(
      <MultiSelectStep
        {...DEFAULT_PROPS}
        headerContent={<div data-testid="custom-header">Header</div>}
      />,
    );

    expect(screen.getByTestId('custom-header')).toBeInTheDocument();
  });

  it('passes the stepTitle to the layout', () => {
    setupMocks({isLoading: false, stepData: MOCK_STEP_DATA_WITHOUT_TEXT});

    render(<MultiSelectStep {...DEFAULT_PROPS} />);

    expect(screen.getByTestId('step-title')).toHaveTextContent('Lived Values');
  });

  it('calls navigateToNextStep when Continue is clicked and save succeeds', async () => {
    const mockNavigateToNextStep = jest.fn();
    const mockSaveAnswers = jest.fn().mockResolvedValue(true);

    const useStepNavigation = jest.requireMock(
      '@/app/hooks/useEmployeeStepNavigation',
    );

    useStepNavigation.mockReturnValue({
      navigateToNextStep: mockNavigateToNextStep,
    });

    const useEmployeeSurveyStep = jest.requireMock(
      '@/app/hooks/useEmployeeSurveyStep',
    );

    useEmployeeSurveyStep.mockReturnValue({
      error: null,
      isLoading: false,
      isSaving: false,
      saveAnswers: mockSaveAnswers,
      stepData: MOCK_STEP_DATA_WITHOUT_TEXT,
    });

    const useSurveyStepState = jest.requireMock(
      '@/app/hooks/useSurveyStepState',
    );

    useSurveyStepState.mockReturnValue({
      additionalContext: '',
      selectedFactors: ['opt-1'],
      setAdditionalContext: jest.fn(),
      setSelectedFactors: jest.fn(),
    });

    render(<MultiSelectStep {...DEFAULT_PROPS} />);

    fireEvent.click(screen.getByRole('button', {name: 'Continue'}));

    await waitFor(() => {
      expect(mockNavigateToNextStep).toHaveBeenCalled();
    });
  });

  it('does not navigate when save fails', async () => {
    const mockNavigateToNextStep = jest.fn();
    const mockSaveAnswers = jest.fn().mockResolvedValue(false);

    const useStepNavigation = jest.requireMock(
      '@/app/hooks/useEmployeeStepNavigation',
    );

    useStepNavigation.mockReturnValue({
      navigateToNextStep: mockNavigateToNextStep,
    });

    const useEmployeeSurveyStep = jest.requireMock(
      '@/app/hooks/useEmployeeSurveyStep',
    );

    useEmployeeSurveyStep.mockReturnValue({
      error: null,
      isLoading: false,
      isSaving: false,
      saveAnswers: mockSaveAnswers,
      stepData: MOCK_STEP_DATA_WITHOUT_TEXT,
    });

    const useSurveyStepState = jest.requireMock(
      '@/app/hooks/useSurveyStepState',
    );

    useSurveyStepState.mockReturnValue({
      additionalContext: '',
      selectedFactors: ['opt-1'],
      setAdditionalContext: jest.fn(),
      setSelectedFactors: jest.fn(),
    });

    render(<MultiSelectStep {...DEFAULT_PROPS} />);

    fireEvent.click(screen.getByRole('button', {name: 'Continue'}));

    await waitFor(() => {
      expect(mockSaveAnswers).toHaveBeenCalled();
    });

    expect(mockNavigateToNextStep).not.toHaveBeenCalled();
  });
});
