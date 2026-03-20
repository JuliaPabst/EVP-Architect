import {useCallback} from 'react';

import {useRouter} from 'next/navigation';

import {
  buildProjectUrl,
  buildStepUrl,
} from '@/app/evp-architect/project/[projectId]/employer-survey/utils/surveyStepUtils';

interface UseStepNavigationResult {
  readonly navigateToNextStep: () => void;
  readonly navigateToPreviousStep: () => void;
  readonly navigateToProject: () => void;
  readonly navigateToStep: (step: number) => void;
}

/**
 * Custom hook to handle navigation between survey steps
 *
 * Provides navigation functions that handle admin token persistence
 * and proper URL building for step transitions.
 *
 * @param projectId - UUID of the project
 * @param currentStep - Current step number (1-5)
 * @param adminToken - Admin token for authentication
 * @returns Navigation functions
 */
export default function useEmployerStepNavigation(
  projectId: string,
  currentStep: number,
  adminToken: string | null,
): UseStepNavigationResult {
  const router = useRouter();

  const navigateToStep = useCallback(
    (step: number) => {
      router.push(buildStepUrl(projectId, step, adminToken));
    },
    [projectId, adminToken, router],
  );

  const navigateToNextStep = useCallback(() => {
    navigateToStep(currentStep + 1);
  }, [currentStep, navigateToStep]);

  const navigateToPreviousStep = useCallback(() => {
    if (currentStep > 1) {
      navigateToStep(currentStep - 1);
    }
  }, [currentStep, navigateToStep]);

  const navigateToProject = useCallback(() => {
    router.push(buildProjectUrl(projectId));
  }, [projectId, router]);

  return {
    navigateToNextStep,
    navigateToPreviousStep,
    navigateToProject,
    navigateToStep,
  };
}
