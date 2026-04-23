import '@testing-library/jest-dom';
import {fireEvent, render, screen, waitFor} from '@testing-library/react';
import {useRouter} from 'next/navigation';

import Step4Content from '.';

jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}));

jest.mock('@/app/hooks/useEmployerStepNavigation', () => jest.fn());

jest.mock('../../../components/MultiSelectWithTextStep', () => {
  return function MockMultiSelectWithTextStep({
    onAfterSave,
    showBackButton,
    stepNumber,
    stepTitle,
  }: {
    stepNumber: number;
    stepTitle: string;
    onAfterSave?: () => Promise<void>;
    showBackButton?: boolean;
  }) {
    return (
      <div data-testid="multi-select-step">
        <span data-testid="step-title">{stepTitle}</span>
        <span data-testid="step-number">{stepNumber}</span>
        <span data-testid="show-back-button">{String(showBackButton)}</span>
        {onAfterSave && (
          <button
            data-testid="trigger-after-save"
            onClick={onAfterSave}
            type="button"
          >
            Trigger AfterSave
          </button>
        )}
      </div>
    );
  };
});

const DEFAULT_PROPS = {
  adminToken: 'test-admin-token',
  projectId: 'test-project-123',
};

describe('Step4Content', () => {
  const mockPush = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();

    const useStepNavigation = jest.requireMock(
      '@/app/hooks/useEmployerStepNavigation',
    );

    useStepNavigation.mockReturnValue({
      navigateToPreviousStep: jest.fn(),
    });

    (useRouter as jest.Mock).mockReturnValue({push: mockPush});
  });

  it('renders MultiSelectWithTextStep with the correct step title', () => {
    render(<Step4Content {...DEFAULT_PROPS} />);

    expect(screen.getByTestId('step-title')).toHaveTextContent(
      'Leitplanken (Ton & Realitätscheck)',
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

  it('navigates to evp-generation with hash when onAfterSave is triggered', async () => {
    render(<Step4Content {...DEFAULT_PROPS} />);

    fireEvent.click(screen.getByTestId('trigger-after-save'));

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith(
        '/evp-architect/project/test-project-123/evp-generation#admin=test-admin-token',
      );
    });
  });

  it('navigates to evp-generation without hash when adminToken is null', async () => {
    render(<Step4Content {...DEFAULT_PROPS} adminToken={null} />);

    fireEvent.click(screen.getByTestId('trigger-after-save'));

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith(
        '/evp-architect/project/test-project-123/evp-generation',
      );
    });
  });
});
