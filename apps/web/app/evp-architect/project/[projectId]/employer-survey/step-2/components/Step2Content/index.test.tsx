import '@testing-library/jest-dom';
import type {ReactNode} from 'react';

import {render, screen} from '@testing-library/react';

import Step2Content from '.';

jest.mock('@/app/hooks/useEmployerSurveyStep', () => jest.fn());

jest.mock('@/app/hooks/useSurveyStepState', () => jest.fn());

jest.mock('@/app/hooks/useEmployerStepNavigation', () => jest.fn());

jest.mock('@/app/components/survey/TextSection', () => {
  return function MockTextSection({title}: {title: string}) {
    return <div data-testid="text-section">{title}</div>;
  };
});

jest.mock('@/app/components/survey/NavigationButtons', () => {
  return function MockNavButtons({
    canContinue,
    onBack,
    onContinue,
  }: {
    canContinue: boolean;
    onBack?: () => void;
    onContinue?: () => void;
  }) {
    return (
      <div>
        <button disabled={!canContinue} onClick={onContinue} type="button">
          Continue
        </button>
        {onBack && (
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
  }: {
    children: ReactNode;
    isLoading: boolean;
    error?: string | null;
  }) {
    if (isLoading) {
      return <div data-testid="loading">Loading survey questions...</div>;
    }
    if (error && !isLoading) {
      return <div data-testid="error">Error: {error}</div>;
    }
    return <div>{children}</div>;
  };
});

jest.mock('../../../components/SurveyCardHeader', () => {
  return function MockSurveyCardHeader() {
    return null;
  };
});

const MOCK_STEP_DATA_TWO_QUESTIONS = {
  questions: [
    {id: 'q1', prompt: 'Question One prompt', type: 'text'},
    {id: 'q2', prompt: 'Question Two prompt', type: 'text'},
  ],
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
    questions: {id: string; prompt: string; type: string}[];
  } | null;
  textAnswers?: Record<string, string>;
} = {}) {
  const useEmployerSurveyStep = jest.requireMock(
    '@/app/hooks/useEmployerSurveyStep',
  );
  const useSurveyStepState = jest.requireMock(
    '@/app/hooks/useSurveyStepState',
  );
  const useStepNavigation = jest.requireMock(
    '@/app/hooks/useEmployerStepNavigation',
  );

  useEmployerSurveyStep.mockReturnValue({
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
    navigateToNextStep: jest.fn(),
    navigateToPreviousStep: jest.fn(),
  });
}

const DEFAULT_PROPS = {
  adminToken: 'test-admin-token',
  projectId: 'test-project-123',
};

describe('Step2Content', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('shows "Failed to load survey questions" when no stepData after load', () => {
    setupMocks({isLoading: false, stepData: null});

    render(<Step2Content {...DEFAULT_PROPS} />);

    expect(
      screen.getByText('Error: Failed to load survey questions'),
    ).toBeInTheDocument();
  });

  it('shows loading state when isLoading is true', () => {
    setupMocks({isLoading: true, stepData: null});

    render(<Step2Content {...DEFAULT_PROPS} />);

    expect(screen.getByTestId('loading')).toBeInTheDocument();
  });

  it('renders two text sections when step data has 2 questions', () => {
    setupMocks({
      isLoading: false,
      stepData: MOCK_STEP_DATA_TWO_QUESTIONS,
      textAnswers: {q1: 'some answer', q2: 'another answer'},
    });

    render(<Step2Content {...DEFAULT_PROPS} />);

    const textSections = screen.getAllByTestId('text-section');

    expect(textSections).toHaveLength(2);
    expect(textSections[0]).toHaveTextContent('Question One prompt');
    expect(textSections[1]).toHaveTextContent('Question Two prompt');
  });

  it('has Continue button disabled when answers are empty', () => {
    setupMocks({
      isLoading: false,
      stepData: MOCK_STEP_DATA_TWO_QUESTIONS,
      textAnswers: {q1: '', q2: ''},
    });

    render(<Step2Content {...DEFAULT_PROPS} />);

    const continueButton = screen.getByRole('button', {name: 'Continue'});

    expect(continueButton).toBeDisabled();
  });
});
