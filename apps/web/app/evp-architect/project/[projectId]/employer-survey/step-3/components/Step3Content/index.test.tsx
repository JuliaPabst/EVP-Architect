import '@testing-library/jest-dom';
import {render, screen} from '@testing-library/react';

import Step3Content from '.';

jest.mock('@/app/hooks/useEmployerSurveyStep', () => jest.fn());

jest.mock('../../../hooks/useSurveyStepState', () => jest.fn());

jest.mock('../../../hooks/useStepNavigation', () => jest.fn());

jest.mock('../../../step-1/components/TextSection', () => {
  return function MockTextSection({title}: any) {
    return <div data-testid="text-section">{title}</div>;
  };
});

jest.mock('../../../step-1/components/NavigationButtons', () => {
  return function MockNavButtons({canContinue, onBack, onContinue}: any) {
    return (
      <div>
        <button disabled={!canContinue} onClick={onContinue}>
          Continue
        </button>
        {onBack && <button onClick={onBack}>Back</button>}
      </div>
    );
  };
});

jest.mock('../../../components/StepContentLayout', () => {
  return function MockStepContentLayout({children, error, isLoading}: any) {
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
  stepData?: any;
  textAnswers?: Record<string, string>;
} = {}) {
  const useEmployerSurveyStep = jest.requireMock(
    '@/app/hooks/useEmployerSurveyStep',
  );
  const useSurveyStepState = jest.requireMock(
    '../../../hooks/useSurveyStepState',
  );
  const useStepNavigation = jest.requireMock(
    '../../../hooks/useStepNavigation',
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
