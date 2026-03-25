import {useEffect, useState} from 'react';

import {
  SaveAnswerPayload,
  StepData,
  fetchStepFromApi,
  getCachedStepData,
  getErrorMessage,
  inFlightStepRequests,
  mergeSavedAnswers,
  setCachedStepData,
} from './surveyStepCache';

interface UseEmployeeSurveyStepResult {
  readonly error: string | null;
  readonly isLoading: boolean;
  readonly isSaving: boolean;
  readonly saveAnswers: (answers: SaveAnswerPayload[]) => Promise<boolean>;
  readonly stepData: StepData | null;
  readonly submissionId: string | null;
}

function getCacheKey(
  projectId: string,
  submissionId: string,
  step: number,
): string {
  return `${projectId}:${submissionId}:${step}`;
}

function getStorageKey(projectId: string): string {
  return `evp_employee_submission_${projectId}`;
}

function getStoredSubmissionId(projectId: string): string | null {
  try {
    return localStorage.getItem(getStorageKey(projectId));
  } catch {
    return null;
  }
}

function storeSubmissionId(projectId: string, submissionId: string): void {
  try {
    localStorage.setItem(getStorageKey(projectId), submissionId);
  } catch {
    // localStorage not available
  }
}

/**
 * Custom hook to fetch and save employee survey step data.
 *
 * Purpose:
 *   Handles submission creation, data fetching and saving for a specific survey step.
 *   Stores the submission ID in localStorage so employees can resume their survey.
 *   No authentication token required.
 *
 * @param projectId - UUID of the project
 * @param step - Step number (1-5)
 * @returns Object with stepData, loading states, error, submissionId, and save function
 */
export default function useEmployeeSurveyStep(
  projectId: string,
  step: number,
): UseEmployeeSurveyStepResult {
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [stepData, setStepData] = useState<StepData | null>(null);
  const [submissionId, setSubmissionId] = useState<string | null>(null);

  useEffect(() => {
    let isDisposed = false;

    const fetchStepData = async () => {
      try {
        if (!isDisposed) {
          setIsLoading(true);
          setError(null);
        }

        let currentSubmissionId = getStoredSubmissionId(projectId);

        const submissionIdParam = currentSubmissionId
          ? `&submission_id=${currentSubmissionId}`
          : '';
        const submissionResponse = await fetch(
          `/api/employee-survey/submission?projectId=${projectId}${submissionIdParam}`,
          {method: 'POST'},
        );

        if (!submissionResponse.ok) {
          throw new Error('Failed to initialize survey session');
        }

        const submissionData = await submissionResponse.json();

        const fetchedSubmissionId: string = submissionData.submission_id;

        currentSubmissionId = fetchedSubmissionId;
        storeSubmissionId(projectId, fetchedSubmissionId);

        if (!isDisposed) {
          setSubmissionId(fetchedSubmissionId);
        }

        const cacheKey = getCacheKey(projectId, fetchedSubmissionId, step);
        const cached = getCachedStepData(cacheKey);

        if (cached) {
          if (!isDisposed) {
            setStepData(cached);
            setIsLoading(false);
          }

          return;
        }

        const url = `/api/employee-survey/step/${step}?projectId=${projectId}&submission_id=${currentSubmissionId}`;
        let inFlightRequest = inFlightStepRequests.get(cacheKey);

        if (!inFlightRequest) {
          inFlightRequest = fetchStepFromApi(url);
          inFlightStepRequests.set(cacheKey, inFlightRequest);
        }

        const data = await inFlightRequest;

        setCachedStepData(cacheKey, data);

        if (!isDisposed) {
          setStepData(data);
        }
      } catch (error_) {
        if (!isDisposed) {
          setError(getErrorMessage(error_));
        }
      } finally {
        const storedId = getStoredSubmissionId(projectId);

        if (storedId) {
          const cacheKey = getCacheKey(projectId, storedId, step);

          inFlightStepRequests.delete(cacheKey);
        }

        if (!isDisposed) {
          setIsLoading(false);
        }
      }
    };

    fetchStepData().catch(() => undefined);

    return () => {
      isDisposed = true;
    };
  }, [projectId, step]);

  const saveAnswers = async (
    answers: SaveAnswerPayload[],
  ): Promise<boolean> => {
    const currentSubmissionId =
      submissionId || getStoredSubmissionId(projectId);

    if (!currentSubmissionId) {
      setError('Survey session not initialized');
      return false;
    }

    try {
      setIsSaving(true);
      setError(null);

      const url = `/api/employee-survey/step/${step}?projectId=${projectId}&submission_id=${currentSubmissionId}`;
      const response = await fetch(url, {
        body: JSON.stringify({answers}),
        headers: {
          'Content-Type': 'application/json',
        },
        method: 'POST',
      });

      if (!response.ok) {
        const errorData = await response.json();

        throw new Error(errorData.message || 'Failed to save survey data');
      }

      const cacheKey = getCacheKey(projectId, currentSubmissionId, step);

      setStepData(currentStepData => {
        if (!currentStepData) {
          return currentStepData;
        }

        const updatedStepData = mergeSavedAnswers(currentStepData, answers);

        setCachedStepData(cacheKey, updatedStepData);

        return updatedStepData;
      });

      const cachedStepData = getCachedStepData(cacheKey);

      if (cachedStepData) {
        setCachedStepData(cacheKey, mergeSavedAnswers(cachedStepData, answers));
      }

      return true;
    } catch (error_) {
      const errorMessage =
        error_ instanceof Error ? error_.message : 'Failed to save data';

      setError(errorMessage);
      return false;
    } finally {
      setIsSaving(false);
    }
  };

  return {
    error,
    isLoading,
    isSaving,
    saveAnswers,
    stepData,
    submissionId,
  };
}
