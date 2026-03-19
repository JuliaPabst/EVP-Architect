import '@testing-library/jest-dom';
import type {ReactNode} from 'react';

import {render, screen} from '@testing-library/react';

import MultiSelectWithTextStep from '.';

jest.mock('@/app/hooks/useEmployerSurveyStep', () => jest.fn());

jest.mock('../../hooks/useSurveyStepState', () => jest.fn());

jest.mock('../../hooks/useStepNavigation', () => jest.fn());

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
  }: {
    canContinue: boolean;
    onContinue?: () => void;
  }) {
    return (
      <button
        data-can-continue={String(canContinue)}
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
  }: {
    children: ReactNode;
    isLoading: boolean;
    error?: string | null;
  }) {
    if (isLoading) {
      return <div data-testid="loading">Loading</div>;
    }
    if (error && !isLoading) {
      return <div data-testid="error">{error}</div>;
    }
    return <div>{children}</div>;
  };
});

jest.mock('@/app/components/survey/SurveyCardHeader', () => {
  return function MockSurveyCardHeader() {
    return null;
  };
});

const MOCK_MULTI_SELECT_QUESTION = {
  id: 'ms-q1',
  options: [
    {label: 'Option One', value_key: 'opt-1'},
    {label: 'Option Two', value_key: 'opt-2'},
  ],
  prompt: 'Select your focus areas',
  question_type: 'multi_select',
  selection_limit: 5,
};

const MOCK_TEXT_QUESTION = {
  id: 'txt-q1',
  prompt: 'Add additional context',
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
  const useEmployerSurveyStep = jest.requireMock(
    '@/app/hooks/useEmployerSurveyStep',
  );
  const useSurveyStepState = jest.requireMock('../../hooks/useSurveyStepState');
  const useStepNavigation = jest.requireMock('../../hooks/useStepNavigation');

  useEmployerSurveyStep.mockReturnValue({
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
  adminToken: 'test-admin-token',
  onBackNavigation: jest.fn(),
  projectId: 'test-project-123',
  stepNumber: 1,
  stepTitle: 'Who you are today (Culture & Values)?',
};

describe('MultiSelectWithTextStep', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('shows error fallback when no multiSelectQuestion and not loading', () => {
    setupMocks({isLoading: false, stepData: null});

    render(<MultiSelectWithTextStep {...DEFAULT_PROPS} />);

    expect(
      screen.getByText('Failed to load survey questions'),
    ).toBeInTheDocument();
  });

  it('shows loading state when isLoading is true', () => {
    setupMocks({isLoading: true, stepData: null});

    render(<MultiSelectWithTextStep {...DEFAULT_PROPS} />);

    expect(screen.getByTestId('loading')).toBeInTheDocument();
  });

  it('renders FocusSelection when step data with multi-select question is available', () => {
    setupMocks({
      isLoading: false,
      selectedFactors: [],
      stepData: MOCK_STEP_DATA_WITHOUT_TEXT,
    });

    render(<MultiSelectWithTextStep {...DEFAULT_PROPS} />);

    expect(screen.getByTestId('focus-selection')).toBeInTheDocument();
    expect(screen.getByTestId('focus-selection')).toHaveTextContent(
      'Select your focus areas',
    );
  });

  it('renders optional TextSection when a text question exists', () => {
    setupMocks({
      isLoading: false,
      selectedFactors: ['opt-1'],
      stepData: MOCK_STEP_DATA_WITH_TEXT,
    });

    render(<MultiSelectWithTextStep {...DEFAULT_PROPS} />);

    expect(screen.getByTestId('text-section')).toBeInTheDocument();
    expect(screen.getByTestId('text-section')).toHaveTextContent(
      'Add additional context',
    );
  });

  it('does not render TextSection when no text question exists', () => {
    setupMocks({
      isLoading: false,
      selectedFactors: ['opt-1'],
      stepData: MOCK_STEP_DATA_WITHOUT_TEXT,
    });

    render(<MultiSelectWithTextStep {...DEFAULT_PROPS} />);

    expect(screen.queryByTestId('text-section')).not.toBeInTheDocument();
  });

  it('enables Continue button when 1 factor is selected', () => {
    setupMocks({
      isLoading: false,
      isSaving: false,
      selectedFactors: ['opt-1'],
      stepData: MOCK_STEP_DATA_WITHOUT_TEXT,
    });

    render(<MultiSelectWithTextStep {...DEFAULT_PROPS} />);

    const continueButton = screen.getByRole('button', {name: 'Continue'});

    expect(continueButton).toBeEnabled();
    expect(continueButton).toHaveAttribute('data-can-continue', 'true');
  });

  it('disables Continue button when no factors are selected', () => {
    setupMocks({
      isLoading: false,
      isSaving: false,
      selectedFactors: [],
      stepData: MOCK_STEP_DATA_WITHOUT_TEXT,
    });

    render(<MultiSelectWithTextStep {...DEFAULT_PROPS} />);

    const continueButton = screen.getByRole('button', {name: 'Continue'});

    expect(continueButton).toBeDisabled();
    expect(continueButton).toHaveAttribute('data-can-continue', 'false');
  });
});
