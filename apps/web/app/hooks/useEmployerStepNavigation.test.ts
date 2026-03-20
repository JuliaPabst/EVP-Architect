import '@testing-library/jest-dom';
import {renderHook} from '@testing-library/react';
import {useRouter} from 'next/navigation';

import useEmployerStepNavigation from './useEmployerStepNavigation';

jest.mock('next/navigation', () => ({
  useRouter: jest.fn(() => ({push: jest.fn()})),
  useSearchParams: jest.fn(),
}));

jest.mock('@/app/evp-architect/project/[projectId]/employer-survey/utils/surveyStepUtils', () => ({
  buildProjectUrl: jest.fn(
    (projectId: string) => `/evp-architect/project/${projectId}`,
  ),
  buildStepUrl: jest.fn(
    (projectId: string, step: number, adminToken: string | null) => {
      const base = `/evp-architect/project/${projectId}/employer-survey/step-${step}`;

      return adminToken ? `${base}?admin=${adminToken}` : base;
    },
  ),
}));

describe('useStepNavigation', () => {
  const mockPush = jest.fn();
  const PROJECT_ID = 'proj-nav-123';
  const ADMIN_TOKEN = 'token-abc';

  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue({push: mockPush});
  });

  it('navigateToStep(3) calls router.push with the correct URL', () => {
    const {result} = renderHook(() =>
      useEmployerStepNavigation(PROJECT_ID, 1, ADMIN_TOKEN),
    );

    result.current.navigateToStep(3);

    expect(mockPush).toHaveBeenCalledWith(
      `/evp-architect/project/${PROJECT_ID}/employer-survey/step-3?admin=${ADMIN_TOKEN}`,
    );
  });

  it('navigateToNextStep() calls router.push for step + 1', () => {
    const {result} = renderHook(() =>
      useEmployerStepNavigation(PROJECT_ID, 2, ADMIN_TOKEN),
    );

    result.current.navigateToNextStep();

    expect(mockPush).toHaveBeenCalledWith(
      `/evp-architect/project/${PROJECT_ID}/employer-survey/step-3?admin=${ADMIN_TOKEN}`,
    );
  });

  it('navigateToPreviousStep() calls router.push for step - 1 when currentStep > 1', () => {
    const {result} = renderHook(() =>
      useEmployerStepNavigation(PROJECT_ID, 3, ADMIN_TOKEN),
    );

    result.current.navigateToPreviousStep();

    expect(mockPush).toHaveBeenCalledWith(
      `/evp-architect/project/${PROJECT_ID}/employer-survey/step-2?admin=${ADMIN_TOKEN}`,
    );
  });

  it('navigateToPreviousStep() does NOT navigate when currentStep is 1', () => {
    const {result} = renderHook(() =>
      useEmployerStepNavigation(PROJECT_ID, 1, ADMIN_TOKEN),
    );

    result.current.navigateToPreviousStep();

    expect(mockPush).not.toHaveBeenCalled();
  });

  it('navigateToProject() calls router.push with the project URL', () => {
    const {result} = renderHook(() =>
      useEmployerStepNavigation(PROJECT_ID, 2, ADMIN_TOKEN),
    );

    result.current.navigateToProject();

    expect(mockPush).toHaveBeenCalledWith(
      `/evp-architect/project/${PROJECT_ID}`,
    );
  });
});
