import '@testing-library/jest-dom';
import {render, screen} from '@testing-library/react';

import Step4Content from '.';

jest.mock('@/app/hooks/useEmployerStepNavigation', () => jest.fn());

jest.mock('../../../components/MultiSelectWithTextStep', () => {
  return function MockMultiSelectWithTextStep({
    showBackButton,
    stepNumber,
    stepTitle,
  }: {
    stepNumber: number;
    stepTitle: string;
    showBackButton?: boolean;
  }) {
    return (
      <div data-testid="multi-select-step">
        <span data-testid="step-title">{stepTitle}</span>
        <span data-testid="step-number">{stepNumber}</span>
        <span data-testid="show-back-button">{String(showBackButton)}</span>
      </div>
    );
  };
});

const DEFAULT_PROPS = {
  adminToken: 'test-admin-token',
  projectId: 'test-project-123',
};

describe('Step4Content', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    const useStepNavigation = jest.requireMock(
      '@/app/hooks/useEmployerStepNavigation',
    );

    useStepNavigation.mockReturnValue({
      navigateToPreviousStep: jest.fn(),
    });
  });

  it('renders MultiSelectWithTextStep with the correct step title', () => {
    render(<Step4Content {...DEFAULT_PROPS} />);

    expect(screen.getByTestId('step-title')).toHaveTextContent(
      'Guardrails (Tone & Reality Check)',
    );
  });

  it('passes the correct stepNumber 4 to MultiSelectWithTextStep', () => {
    render(<Step4Content {...DEFAULT_PROPS} />);

    expect(screen.getByTestId('step-number')).toHaveTextContent('4');
  });

  it('calls useStepNavigation with correct projectId, stepNumber and adminToken', () => {
    render(<Step4Content {...DEFAULT_PROPS} />);

    const useStepNavigation = jest.requireMock(
      '@/app/hooks/useEmployerStepNavigation',
    );

    expect(useStepNavigation).toHaveBeenCalledWith(
      'test-project-123',
      4,
      'test-admin-token',
    );
  });
});
