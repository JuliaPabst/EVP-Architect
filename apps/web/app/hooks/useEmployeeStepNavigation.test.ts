import '@testing-library/jest-dom';
import {renderHook} from '@testing-library/react';
import {useRouter} from 'next/navigation';

import useEmployeeStepNavigation from './useEmployeeStepNavigation';

jest.mock('next/navigation', () => ({
  useRouter: jest.fn(() => ({push: jest.fn()})),
}));

jest.mock(
  '@/app/evp-architect/project/[projectId]/employee-survey/utils/surveyStepUtils',
  () => ({
    buildCompleteUrl: jest.fn(
      (projectId: string) =>
        `/evp-architect/project/${projectId}/employee-survey/complete`,
    ),
    buildStepUrl: jest.fn(
      (projectId: string, step: number) =>
        `/evp-architect/project/${projectId}/employee-survey/step-${step}`,
    ),
  }),
);

describe('useEmployeeStepNavigation', () => {
  const mockPush = jest.fn();
  const PROJECT_ID = 'proj-employee-123';

  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue({push: mockPush});
  });

  it('navigateToStep(3) calls router.push with the correct step URL', () => {
    const {result} = renderHook(() => useEmployeeStepNavigation(PROJECT_ID, 1));

    result.current.navigateToStep(3);

    expect(mockPush).toHaveBeenCalledWith(
      `/evp-architect/project/${PROJECT_ID}/employee-survey/step-3`,
    );
  });

  it('navigateToNextStep() calls router.push for currentStep + 1', () => {
    const {result} = renderHook(() => useEmployeeStepNavigation(PROJECT_ID, 2));

    result.current.navigateToNextStep();

    expect(mockPush).toHaveBeenCalledWith(
      `/evp-architect/project/${PROJECT_ID}/employee-survey/step-3`,
    );
  });

  it('navigateToPreviousStep() calls router.push for currentStep - 1 when currentStep > 1', () => {
    const {result} = renderHook(() => useEmployeeStepNavigation(PROJECT_ID, 3));

    result.current.navigateToPreviousStep();

    expect(mockPush).toHaveBeenCalledWith(
      `/evp-architect/project/${PROJECT_ID}/employee-survey/step-2`,
    );
  });

  it('navigateToPreviousStep() does NOT navigate when currentStep is 1', () => {
    const {result} = renderHook(() => useEmployeeStepNavigation(PROJECT_ID, 1));

    result.current.navigateToPreviousStep();

    expect(mockPush).not.toHaveBeenCalled();
  });

  it('navigateToComplete() calls router.push with the complete URL', () => {
    const {result} = renderHook(() => useEmployeeStepNavigation(PROJECT_ID, 5));

    result.current.navigateToComplete();

    expect(mockPush).toHaveBeenCalledWith(
      `/evp-architect/project/${PROJECT_ID}/employee-survey/complete`,
    );
  });

  it('navigateToStep(1) from step 4 calls router.push with step-1 URL', () => {
    const {result} = renderHook(() => useEmployeeStepNavigation(PROJECT_ID, 4));

    result.current.navigateToStep(1);

    expect(mockPush).toHaveBeenCalledWith(
      `/evp-architect/project/${PROJECT_ID}/employee-survey/step-1`,
    );
  });
});
