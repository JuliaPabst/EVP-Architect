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

interface UseEmployerSurveyStepResult {
  readonly error: string | null;
  readonly isLoading: boolean;
  readonly isSaving: boolean;
  readonly saveAnswers: (answers: SaveAnswerPayload[]) => Promise<boolean>;
  readonly stepData: StepData | null;
}

function getCacheKey(projectId: string, step: number): string {
  return `${projectId}:${step}`;
}

/**
 * Custom hook to fetch and save employer survey step data.
 *
 * Purpose:
 *   Handles data fetching and saving for a specific survey step.
 *   Provides loading, error states, and save functionality.
 *
 * @param projectId - UUID of the project
 * @param step - Step number (1-5)
 * @param adminToken - Admin token for authentication
 * @returns Object with stepData, loading states, error, and save function
 */
export default function useEmployerSurveyStep(
  projectId: string,
  step: number,
  adminToken: string | null,
): UseEmployerSurveyStepResult {
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [stepData, setStepData] = useState<StepData | null>(null);

  useEffect(() => {
    let isDisposed = false;

    const fetchStepData = async () => {
      if (!adminToken) {
        if (!isDisposed) {
          setError('Authentication token is missing');
          setIsLoading(false);
        }
        return;
      }

      try {
        if (!isDisposed) {
          setIsLoading(true);
          setError(null);
        }

        const cacheKey = getCacheKey(projectId, step);
        const cached = getCachedStepData(cacheKey);

        if (cached) {
          if (!isDisposed) {
            setStepData(cached);
            setIsLoading(false);
          }

          return;
        }

        const url = `/api/employer-survey/step/${step}?projectId=${projectId}`;
        let inFlightRequest = inFlightStepRequests.get(cacheKey);

        if (!inFlightRequest) {
          inFlightRequest = fetchStepFromApi(url, adminToken);

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
        const cacheKey = getCacheKey(projectId, step);

        inFlightStepRequests.delete(cacheKey);

        if (!isDisposed) {
          setIsLoading(false);
        }
      }
    };

    fetchStepData().catch(() => undefined);

    return () => {
      isDisposed = true;
    };
  }, [projectId, step, adminToken]);

  const saveAnswers = async (
    answers: SaveAnswerPayload[],
  ): Promise<boolean> => {
    if (!adminToken) {
      setError('Authentication token is missing');
      return false;
    }

    try {
      setIsSaving(true);
      setError(null);

      const url = `/api/employer-survey/step/${step}?projectId=${projectId}`;
      const response = await fetch(url, {
        body: JSON.stringify({answers}),
        headers: {
          'Content-Type': 'application/json',
          'x-admin-token': adminToken,
        },
        method: 'POST',
      });

      if (!response.ok) {
        const errorData = await response.json();

        throw new Error(errorData.message || 'Failed to save survey data');
      }

      setStepData(currentStepData => {
        if (!currentStepData) {
          return currentStepData;
        }

        return mergeSavedAnswers(currentStepData, answers);
      });

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
  };
}
