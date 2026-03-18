import '@testing-library/jest-dom';
import type {ReactNode} from 'react';

import {act, fireEvent, render, screen, waitFor} from '@testing-library/react';

import Step5Content from '.';

global.fetch = jest.fn();

jest.mock('@/app/hooks/useEmployerSurveyStep', () => jest.fn());

jest.mock('../../../hooks/useStepNavigation', () => jest.fn());

jest.mock('../../../step-1/components/NavigationButtons', () => {
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

jest.mock('../../../components/StepContentLayout', () => {
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

jest.mock('@kununu/ui/atoms/FormInputWrapper', () => {
  return function MockFormInputWrapper({
    children,
    label,
  }: {
    children: ReactNode;
    label: string;
  }) {
    return (
      <div>
        <span>{label}</span>
        {children}
      </div>
    );
  };
});

jest.mock('@kununu/ui/atoms/TextInput', () => {
  return function MockTextInput({
    name,
    onChange,
    value,
  }: {
    name: string;
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    value: string;
  }) {
    return (
      <input
        data-testid={`text-input-${name}`}
        name={name}
        onChange={onChange}
        value={value}
      />
    );
  };
});

jest.mock('@kununu/ui/molecules/Select', () => {
  return function MockSelect({
    items,
    name,
    onChange,
    value,
  }: {
    items: {id: string; text: string; value: string}[];
    name: string;
    onChange: (item: {id: string; text: string; value: string} | null) => void;
    value: string;
  }) {
    return (
      <select
        data-testid={`select-${name}`}
        onChange={e => {
          const selected = items.find(item => item.value === e.target.value);

          onChange(selected || null);
        }}
        value={value}
      >
        <option value="">Select...</option>
        {items.map(item => (
          <option key={item.id} value={item.value}>
            {item.text}
          </option>
        ))}
      </select>
    );
  };
});

const MOCK_STEP_DATA = {
  questions: [
    {
      answer: null,
      id: 'q-audience',
      key: 'target_audience',
      options: [
        {label: 'Internal', value_key: 'interne_kommunikation'},
        {label: 'External', value_key: 'externe_kommunikation'},
      ],
      prompt: 'Who is your target audience?',
      question_type: 'single_select',
      selection_limit: 1,
    },
    {
      answer: null,
      id: 'q-detail',
      key: 'target_audience_detail',
      options: [],
      prompt: 'Who do you want to address?',
      question_type: 'text',
      selection_limit: null,
    },
    {
      answer: null,
      id: 'q-style',
      key: 'tone_of_voice',
      options: [
        {label: 'Formal', value_key: 'formal'},
        {label: 'Casual', value_key: 'casual'},
      ],
      prompt: 'What tone of voice?',
      question_type: 'single_select',
      selection_limit: 1,
    },
    {
      answer: null,
      id: 'q-lang',
      key: 'language',
      options: [
        {label: 'German', value_key: 'de'},
        {label: 'English', value_key: 'en'},
      ],
      prompt: 'Which language?',
      question_type: 'single_select',
      selection_limit: 1,
    },
  ],
  step: 5,
};

const DEFAULT_PROPS = {
  adminToken: 'test-admin-token',
  projectId: 'test-project-123',
};

function setupMocks({
  error = null,
  isLoading = false,
  isSaving = false,
  navigateToPreviousStep = jest.fn(),
  navigateToProject = jest.fn(),
  saveAnswers = jest.fn().mockResolvedValue(true),
  stepData = null,
}: {
  error?: string | null;
  isLoading?: boolean;
  isSaving?: boolean;
  navigateToPreviousStep?: jest.Mock;
  navigateToProject?: jest.Mock;
  saveAnswers?: jest.Mock;
  stepData?: object | null;
} = {}) {
  const useEmployerSurveyStep = jest.requireMock(
    '@/app/hooks/useEmployerSurveyStep',
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

  useStepNavigation.mockReturnValue({
    navigateToPreviousStep,
    navigateToProject,
  });

  return {navigateToPreviousStep, navigateToProject, saveAnswers};
}

describe('Step5Content', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('shows loading state when isLoading is true', () => {
    setupMocks({isLoading: true});

    render(<Step5Content {...DEFAULT_PROPS} />);

    expect(screen.getByTestId('loading')).toBeInTheDocument();
  });

  it('shows "Failed to load survey questions" when required questions are missing after load', () => {
    setupMocks({isLoading: false, stepData: {questions: [], step: 5}});

    render(<Step5Content {...DEFAULT_PROPS} />);

    expect(
      screen.getByText('Error: Failed to load survey questions'),
    ).toBeInTheDocument();
  });

  it('renders select fields when stepData has all required questions', () => {
    setupMocks({isLoading: false, stepData: MOCK_STEP_DATA});

    render(<Step5Content {...DEFAULT_PROPS} />);

    expect(screen.getByTestId('select-target_audience')).toBeInTheDocument();
    expect(screen.getByTestId('select-tone_of_voice')).toBeInTheDocument();
    expect(screen.getByTestId('select-language')).toBeInTheDocument();
  });

  it('Continue button is disabled when no selections are made', () => {
    setupMocks({isLoading: false, stepData: MOCK_STEP_DATA});

    render(<Step5Content {...DEFAULT_PROPS} />);

    expect(screen.getByRole('button', {name: 'Continue'})).toBeDisabled();
  });

  it('calls useStepNavigation with correct args', () => {
    setupMocks({isLoading: false, stepData: MOCK_STEP_DATA});

    render(<Step5Content {...DEFAULT_PROPS} />);

    const useStepNavigation = jest.requireMock(
      '../../../hooks/useStepNavigation',
    );

    expect(useStepNavigation).toHaveBeenCalledWith(
      'test-project-123',
      5,
      'test-admin-token',
    );
  });

  it('calls navigateToPreviousStep when Back is clicked', () => {
    const navigateToPreviousStep = jest.fn();

    setupMocks({
      isLoading: false,
      navigateToPreviousStep,
      stepData: MOCK_STEP_DATA,
    });

    render(<Step5Content {...DEFAULT_PROPS} />);

    fireEvent.click(screen.getByRole('button', {name: 'Back'}));

    expect(navigateToPreviousStep).toHaveBeenCalledTimes(1);
  });

  it('saves answers, calls complete endpoint, and navigates to project on success', async () => {
    const navigateToProject = jest.fn();
    const saveAnswers = jest.fn().mockResolvedValue(true);

    setupMocks({
      isLoading: false,
      navigateToProject,
      saveAnswers,
      stepData: MOCK_STEP_DATA,
    });

    (global.fetch as jest.Mock).mockResolvedValueOnce({
      json: jest.fn().mockResolvedValue({success: true}),
      ok: true,
    });

    render(<Step5Content {...DEFAULT_PROPS} />);

    // Fill in all required fields
    act(() => {
      screen
        .getByTestId('select-target_audience')
        .dispatchEvent(new Event('change', {bubbles: true}));
    });

    // Directly fire change events via userEvent-style simulation
    const audienceSelect = screen.getByTestId('select-target_audience');
    const styleSelect = screen.getByTestId('select-tone_of_voice');
    const langSelect = screen.getByTestId('select-language');

    act(() => {
      Object.defineProperty(audienceSelect, 'value', {
        configurable: true,
        value: 'interne_kommunikation',
      });
      audienceSelect.dispatchEvent(new Event('change', {bubbles: true}));

      Object.defineProperty(styleSelect, 'value', {
        configurable: true,
        value: 'formal',
      });
      styleSelect.dispatchEvent(new Event('change', {bubbles: true}));

      Object.defineProperty(langSelect, 'value', {
        configurable: true,
        value: 'de',
      });
      langSelect.dispatchEvent(new Event('change', {bubbles: true}));
    });

    await waitFor(() => {
      expect(screen.getByRole('button', {name: 'Continue'})).toBeEnabled();
    });

    fireEvent.click(screen.getByRole('button', {name: 'Continue'}));

    await waitFor(() => {
      expect(saveAnswers).toHaveBeenCalledTimes(1);
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/employer-survey/complete'),
        {method: 'POST'},
      );
      expect(navigateToProject).toHaveBeenCalledTimes(1);
    });
  });

  it('does not call complete endpoint when saveAnswers returns false', async () => {
    const navigateToProject = jest.fn();
    const saveAnswers = jest.fn().mockResolvedValue(false);

    setupMocks({
      isLoading: false,
      navigateToProject,
      saveAnswers,
      stepData: MOCK_STEP_DATA,
    });

    render(<Step5Content {...DEFAULT_PROPS} />);

    const audienceSelect = screen.getByTestId('select-target_audience');
    const styleSelect = screen.getByTestId('select-tone_of_voice');
    const langSelect = screen.getByTestId('select-language');

    act(() => {
      Object.defineProperty(audienceSelect, 'value', {
        configurable: true,
        value: 'interne_kommunikation',
      });
      audienceSelect.dispatchEvent(new Event('change', {bubbles: true}));

      Object.defineProperty(styleSelect, 'value', {
        configurable: true,
        value: 'formal',
      });
      styleSelect.dispatchEvent(new Event('change', {bubbles: true}));

      Object.defineProperty(langSelect, 'value', {
        configurable: true,
        value: 'de',
      });
      langSelect.dispatchEvent(new Event('change', {bubbles: true}));
    });

    await waitFor(() => {
      expect(screen.getByRole('button', {name: 'Continue'})).toBeEnabled();
    });

    fireEvent.click(screen.getByRole('button', {name: 'Continue'}));

    await waitFor(() => {
      expect(saveAnswers).toHaveBeenCalledTimes(1);
    });

    expect(global.fetch).not.toHaveBeenCalled();
    expect(navigateToProject).not.toHaveBeenCalled();
  });

  it('shows error when complete endpoint returns non-ok response', async () => {
    const navigateToProject = jest.fn();
    const saveAnswers = jest.fn().mockResolvedValue(true);

    setupMocks({
      isLoading: false,
      navigateToProject,
      saveAnswers,
      stepData: MOCK_STEP_DATA,
    });

    (global.fetch as jest.Mock).mockResolvedValueOnce({
      json: jest
        .fn()
        .mockResolvedValue({message: 'missing_required_questions'}),
      ok: false,
    });

    render(<Step5Content {...DEFAULT_PROPS} />);

    const audienceSelect = screen.getByTestId('select-target_audience');
    const styleSelect = screen.getByTestId('select-tone_of_voice');
    const langSelect = screen.getByTestId('select-language');

    act(() => {
      Object.defineProperty(audienceSelect, 'value', {
        configurable: true,
        value: 'interne_kommunikation',
      });
      audienceSelect.dispatchEvent(new Event('change', {bubbles: true}));

      Object.defineProperty(styleSelect, 'value', {
        configurable: true,
        value: 'formal',
      });
      styleSelect.dispatchEvent(new Event('change', {bubbles: true}));

      Object.defineProperty(langSelect, 'value', {
        configurable: true,
        value: 'de',
      });
      langSelect.dispatchEvent(new Event('change', {bubbles: true}));
    });

    await waitFor(() => {
      expect(screen.getByRole('button', {name: 'Continue'})).toBeEnabled();
    });

    fireEvent.click(screen.getByRole('button', {name: 'Continue'}));

    await waitFor(() => {
      expect(navigateToProject).not.toHaveBeenCalled();
      expect(
        screen.getByText('Error: missing_required_questions'),
      ).toBeInTheDocument();
    });
  });
});
