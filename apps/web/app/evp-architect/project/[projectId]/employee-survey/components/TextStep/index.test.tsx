import '@testing-library/jest-dom';
import type {ReactNode} from 'react';

import {fireEvent, render, screen, waitFor} from '@testing-library/react';

import TextStep from '.';

jest.mock('@/app/hooks/useEmployeeSurveyStep', () => jest.fn());

jest.mock('@/app/hooks/useSurveyStepState', () => jest.fn());

jest.mock('@/app/hooks/useEmployeeStepNavigation', () => jest.fn());

jest.mock('@/app/components/survey/TextSection', () => {
  return function MockTextSection({title}: {title: string}) {
    return <div data-testid="text-section">{title}</div>;
  };
});

jest.mock('@/app/components/survey/NavigationButtons', () => {
  return function MockNavigationButtons({
    canContinue,
    onBack,
    onContinue,
    showBackButton,
  }: {
    canContinue: boolean;
    onBack?: () => void;
    onContinue?: () => void;
    showBackButton?: boolean;
  }) {
    return (
      <div>
        <button
          data-can-continue={String(canContinue)}
          disabled={!canContinue}
          onClick={onContinue}
          type="button"
        >
          Continue
        </button>
        {showBackButton && onBack && (
          <button onClick={onBack} type="button">
            Back
          </button>
        )}
      </div>
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

const MOCK_TEXT_QUESTION = {
  id: 'txt-q1',
  prompt: 'Describe a belonging moment',
  question_type: 'long_text',
};

const MOCK_STEP_DATA = {
  questions: [MOCK_TEXT_QUESTION],
};

function setupMocks({
  error = null,
  isLoading = false,
  isSaving = false,
  saveAnswers = jest.fn().mockResolvedValue(true),
  stepData = null,
  textAnswers = {},
}: {
  error?: string | null;
  isLoading?: boolean;
  isSaving?: boolean;
  saveAnswers?: jest.Mock;
  stepData?: {
    questions: {id: string; prompt: string; question_type: string}[];
  } | null;
  textAnswers?: Record<string, string>;
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
    setTextAnswer: jest.fn(),
    textAnswers,
  });

  useStepNavigation.mockReturnValue({
    navigateToComplete: jest.fn(),
    navigateToNextStep: jest.fn(),
    navigateToPreviousStep: jest.fn(),
  });
}

const DEFAULT_PROPS = {
  projectId: 'test-project-123',
  stepNumber: 2,
  stepTitle: 'Belonging Moment',
};

describe('TextStep', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('shows error fallback when no stepData after load', () => {
    setupMocks({isLoading: false, stepData: null});

    render(<TextStep {...DEFAULT_PROPS} />);

    expect(
      screen.getByText('Failed to load survey questions'),
    ).toBeInTheDocument();
  });

  it('shows loading indicator when isLoading is true', () => {
    setupMocks({isLoading: true, stepData: null});

    render(<TextStep {...DEFAULT_PROPS} />);

    expect(screen.getByTestId('loading')).toBeInTheDocument();
  });

  it('renders TextSection with the question prompt', () => {
    setupMocks({
      isLoading: false,
      stepData: MOCK_STEP_DATA,
      textAnswers: {'txt-q1': ''},
    });

    render(<TextStep {...DEFAULT_PROPS} />);

    expect(screen.getByTestId('text-section')).toBeInTheDocument();
    expect(screen.getByTestId('text-section')).toHaveTextContent(
      'Describe a belonging moment',
    );
  });

  it('enables the Continue button when the text answer is non-empty', () => {
    setupMocks({
      isLoading: false,
      isSaving: false,
      stepData: MOCK_STEP_DATA,
      textAnswers: {'txt-q1': 'Some meaningful text'},
    });

    render(<TextStep {...DEFAULT_PROPS} />);

    expect(screen.getByRole('button', {name: 'Continue'})).toBeEnabled();
  });

  it('disables the Continue button when the text answer is empty', () => {
    setupMocks({
      isLoading: false,
      isSaving: false,
      stepData: MOCK_STEP_DATA,
      textAnswers: {'txt-q1': ''},
    });

    render(<TextStep {...DEFAULT_PROPS} />);

    expect(screen.getByRole('button', {name: 'Continue'})).toBeDisabled();
  });

  it('disables the Continue button while saving', () => {
    setupMocks({
      isLoading: false,
      isSaving: true,
      stepData: MOCK_STEP_DATA,
      textAnswers: {'txt-q1': 'Some text'},
    });

    render(<TextStep {...DEFAULT_PROPS} />);

    expect(screen.getByRole('button', {name: 'Continue'})).toBeDisabled();
  });

  it('passes the stepTitle to the layout', () => {
    setupMocks({isLoading: false, stepData: MOCK_STEP_DATA, textAnswers: {}});

    render(<TextStep {...DEFAULT_PROPS} />);

    expect(screen.getByTestId('step-title')).toHaveTextContent(
      'Belonging Moment',
    );
  });

  it('renders a back button for non-last steps', () => {
    setupMocks({
      isLoading: false,
      stepData: MOCK_STEP_DATA,
      textAnswers: {'txt-q1': 'text'},
    });

    render(<TextStep {...DEFAULT_PROPS} stepNumber={2} />);

    expect(screen.getByRole('button', {name: 'Back'})).toBeInTheDocument();
  });

  it('calls navigateToNextStep when Continue is clicked on a non-last step and save succeeds', async () => {
    const mockNavigateToNextStep = jest.fn();
    const mockSaveAnswers = jest.fn().mockResolvedValue(true);

    const useStepNavigation = jest.requireMock(
      '@/app/hooks/useEmployeeStepNavigation',
    );

    useStepNavigation.mockReturnValue({
      navigateToComplete: jest.fn(),
      navigateToNextStep: mockNavigateToNextStep,
      navigateToPreviousStep: jest.fn(),
    });

    const useEmployeeSurveyStep = jest.requireMock(
      '@/app/hooks/useEmployeeSurveyStep',
    );

    useEmployeeSurveyStep.mockReturnValue({
      error: null,
      isLoading: false,
      isSaving: false,
      saveAnswers: mockSaveAnswers,
      stepData: MOCK_STEP_DATA,
    });

    const useSurveyStepState = jest.requireMock(
      '@/app/hooks/useSurveyStepState',
    );

    useSurveyStepState.mockReturnValue({
      setTextAnswer: jest.fn(),
      textAnswers: {'txt-q1': 'Some answer'},
    });

    render(<TextStep {...DEFAULT_PROPS} stepNumber={2} />);

    fireEvent.click(screen.getByRole('button', {name: 'Continue'}));

    await waitFor(() => {
      expect(mockNavigateToNextStep).toHaveBeenCalled();
    });
  });

  it('calls navigateToComplete when Continue is clicked on the last step and save succeeds', async () => {
    const mockNavigateToComplete = jest.fn();
    const mockSaveAnswers = jest.fn().mockResolvedValue(true);

    const useStepNavigation = jest.requireMock(
      '@/app/hooks/useEmployeeStepNavigation',
    );

    useStepNavigation.mockReturnValue({
      navigateToComplete: mockNavigateToComplete,
      navigateToNextStep: jest.fn(),
      navigateToPreviousStep: jest.fn(),
    });

    const useEmployeeSurveyStep = jest.requireMock(
      '@/app/hooks/useEmployeeSurveyStep',
    );

    useEmployeeSurveyStep.mockReturnValue({
      error: null,
      isLoading: false,
      isSaving: false,
      saveAnswers: mockSaveAnswers,
      stepData: MOCK_STEP_DATA,
    });

    const useSurveyStepState = jest.requireMock(
      '@/app/hooks/useSurveyStepState',
    );

    useSurveyStepState.mockReturnValue({
      setTextAnswer: jest.fn(),
      textAnswers: {'txt-q1': 'Final answer'},
    });

    render(<TextStep {...DEFAULT_PROPS} stepNumber={5} />);

    fireEvent.click(screen.getByRole('button', {name: 'Continue'}));

    await waitFor(() => {
      expect(mockNavigateToComplete).toHaveBeenCalled();
    });
  });

  it('does not navigate when save fails', async () => {
    const mockNavigateToNextStep = jest.fn();
    const mockSaveAnswers = jest.fn().mockResolvedValue(false);

    const useStepNavigation = jest.requireMock(
      '@/app/hooks/useEmployeeStepNavigation',
    );

    useStepNavigation.mockReturnValue({
      navigateToComplete: jest.fn(),
      navigateToNextStep: mockNavigateToNextStep,
      navigateToPreviousStep: jest.fn(),
    });

    const useEmployeeSurveyStep = jest.requireMock(
      '@/app/hooks/useEmployeeSurveyStep',
    );

    useEmployeeSurveyStep.mockReturnValue({
      error: null,
      isLoading: false,
      isSaving: false,
      saveAnswers: mockSaveAnswers,
      stepData: MOCK_STEP_DATA,
    });

    const useSurveyStepState = jest.requireMock(
      '@/app/hooks/useSurveyStepState',
    );

    useSurveyStepState.mockReturnValue({
      setTextAnswer: jest.fn(),
      textAnswers: {'txt-q1': 'Some answer'},
    });

    render(<TextStep {...DEFAULT_PROPS} stepNumber={2} />);

    fireEvent.click(screen.getByRole('button', {name: 'Continue'}));

    await waitFor(() => {
      expect(mockSaveAnswers).toHaveBeenCalled();
    });

    expect(mockNavigateToNextStep).not.toHaveBeenCalled();
  });

  it('shows inline error message when error is present alongside step content', () => {
    setupMocks({
      error: 'Failed to save your answer',
      isLoading: false,
      stepData: MOCK_STEP_DATA,
      textAnswers: {'txt-q1': 'Some text'},
    });

    render(<TextStep {...DEFAULT_PROPS} />);

    expect(screen.getByText('Failed to save your answer')).toBeInTheDocument();
  });
});
