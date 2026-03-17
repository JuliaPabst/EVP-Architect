import '@testing-library/jest-dom';
import {render, screen} from '@testing-library/react';

import MultiSelectWithTextStep from '.';

jest.mock('@/app/hooks/useEmployerSurveyStep', () => jest.fn());

jest.mock('../../hooks/useSurveyStepState', () => jest.fn());

jest.mock('../../hooks/useStepNavigation', () => jest.fn());

jest.mock('../../step-1/components/FocusSelection', () => {
  return function MockFocusSelection({title}: any) {
    return <div data-testid="focus-selection">{title}</div>;
  };
});

jest.mock('../../step-1/components/TextSection', () => {
  return function MockTextSection({title}: any) {
    return <div data-testid="text-section">{title}</div>;
  };
});

jest.mock('../../step-1/components/NavigationButtons', () => {
  return function MockNavigationButtons({canContinue, onContinue}: any) {
    return (
      <button
        data-can-continue={String(canContinue)}
        disabled={!canContinue}
        onClick={onContinue}
      >
        Continue
      </button>
    );
  };
});

jest.mock('../StepContentLayout', () => {
  return function MockStepContentLayout({children, error, isLoading}: any) {
    if (isLoading) {
      return <div data-testid="loading">Loading</div>;
    }
    if (error && !isLoading) {
      return <div data-testid="error">{error}</div>;
    }
    return <div>{children}</div>;
  };
});

jest.mock('../SurveyCardHeader', () => {
  return function MockSurveyCardHeader() {
    return null;
  };
});

const MOCK_MULTI_SELECT_QUESTION = {
  id: 'ms-q1',
  options: [
    {id: 'opt-1', label: 'Option One'},
    {id: 'opt-2', label: 'Option Two'},
  ],
  prompt: 'Select your focus areas',
  selection_limit: 5,
  type: 'multi_select',
};

const MOCK_TEXT_QUESTION = {
  id: 'txt-q1',
  prompt: 'Add additional context',
  type: 'text',
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
  selectedFactors = [] as string[],
  stepData = null as any,
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
