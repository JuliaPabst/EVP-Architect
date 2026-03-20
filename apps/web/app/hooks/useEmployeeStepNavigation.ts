import {useCallback} from 'react';

import {useRouter} from 'next/navigation';

import {buildCompleteUrl, buildStepUrl} from '@/app/evp-architect/project/[projectId]/employee-survey/utils/surveyStepUtils';

interface UseStepNavigationResult {
  readonly navigateToComplete: () => void;
  readonly navigateToNextStep: () => void;
  readonly navigateToPreviousStep: () => void;
  readonly navigateToStep: (step: number) => void;
}

/**
 * Custom hook to handle navigation between employee survey steps
 *
 * @param projectId - UUID of the project
 * @param currentStep - Current step number (1-5)
 * @returns Navigation functions
 */
export default function useEmployeeStepNavigation(
  projectId: string,
  currentStep: number,
): UseStepNavigationResult {
  const router = useRouter();

  const navigateToStep = useCallback(
    (step: number) => {
      router.push(buildStepUrl(projectId, step));
    },
    [projectId, router],
  );

  const navigateToNextStep = useCallback(() => {
    navigateToStep(currentStep + 1);
  }, [currentStep, navigateToStep]);

  const navigateToPreviousStep = useCallback(() => {
    if (currentStep > 1) {
      navigateToStep(currentStep - 1);
    }
  }, [currentStep, navigateToStep]);

  const navigateToComplete = useCallback(() => {
    router.push(buildCompleteUrl(projectId));
  }, [projectId, router]);

  return {
    navigateToComplete,
    navigateToNextStep,
    navigateToPreviousStep,
    navigateToStep,
  };
}
