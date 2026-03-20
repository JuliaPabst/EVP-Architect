import '@testing-library/jest-dom';
import type {ReactNode} from 'react';

import {render, screen} from '@testing-library/react';

import Step3Content from '.';

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

const MOCK_STEP_DATA_ONE_QUESTION = {
  questions: [{id: 'q1', prompt: 'What makes you different?', type: 'text'}],
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

describe('Step3Content', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('shows "Failed to load survey questions" when no stepData after load', () => {
    setupMocks({isLoading: false, stepData: null});

    render(<Step3Content {...DEFAULT_PROPS} />);

    expect(
      screen.getByText('Error: Failed to load survey questions'),
    ).toBeInTheDocument();
  });

  it('shows loading state when isLoading is true', () => {
    setupMocks({isLoading: true, stepData: null});

    render(<Step3Content {...DEFAULT_PROPS} />);

    expect(screen.getByTestId('loading')).toBeInTheDocument();
  });

  it('renders a text section when step data has a question', () => {
    setupMocks({
      isLoading: false,
      stepData: MOCK_STEP_DATA_ONE_QUESTION,
      textAnswers: {q1: 'some answer'},
    });

    render(<Step3Content {...DEFAULT_PROPS} />);

    const textSection = screen.getByTestId('text-section');

    expect(textSection).toBeInTheDocument();
    expect(textSection).toHaveTextContent('What makes you different?');
  });

  it('has Continue button disabled when answer is empty', () => {
    setupMocks({
      isLoading: false,
      stepData: MOCK_STEP_DATA_ONE_QUESTION,
      textAnswers: {q1: ''},
    });

    render(<Step3Content {...DEFAULT_PROPS} />);

    const continueButton = screen.getByRole('button', {name: 'Continue'});

    expect(continueButton).toBeDisabled();
  });
});
