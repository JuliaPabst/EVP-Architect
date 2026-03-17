import {useEffect, useState} from 'react';

interface QuestionOption {
  readonly label: string;
  readonly value_key: string;
}

interface Question {
  readonly id: string;
  readonly key: string;
  readonly prompt: string;
  readonly question_type: string;
  readonly selection_limit: number | null;
  readonly answer?: {
    readonly text?: string;
    readonly values?: readonly string[];
  } | null;
  readonly options?: readonly QuestionOption[];
}

interface StepData {
  readonly questions: readonly Question[];
  readonly step: number;
}

interface UseEmployerSurveyStepResult {
  readonly error: string | null;
  readonly isLoading: boolean;
  readonly isSaving: boolean;
  readonly saveAnswers: (answers: SaveAnswerPayload[]) => Promise<boolean>;
  readonly stepData: StepData | null;
}

interface SaveAnswerPayload {
  readonly question_id: string;
  readonly answer_text?: string;
  readonly selected_values?: readonly string[];
}

const STEP_CACHE_TTL_MS = 30_000;

interface CachedStepData {
  readonly data: StepData;
  readonly fetchedAt: number;
}

const stepDataCache = new Map<string, CachedStepData>();
const inFlightStepRequests = new Map<string, Promise<StepData>>();

async function fetchStepFromApi(url: string): Promise<StepData> {
  const response = await fetch(url);

  if (!response.ok) {
    const errorData = await response.json();

    throw new Error(errorData.message || 'Failed to fetch survey data');
  }

  return (await response.json()) as StepData;
}

function getCacheKey(projectId: string, step: number): string {
  return `${projectId}:${step}`;
}

function getCachedStepData(cacheKey: string): StepData | null {
  const cached = stepDataCache.get(cacheKey);

  if (!cached) {
    return null;
  }

  if (Date.now() - cached.fetchedAt > STEP_CACHE_TTL_MS) {
    stepDataCache.delete(cacheKey);
    return null;
  }

  return cached.data;
}

function setCachedStepData(cacheKey: string, data: StepData): void {
  stepDataCache.set(cacheKey, {
    data,
    fetchedAt: Date.now(),
  });
}

function mergeSavedAnswers(
  currentStepData: StepData,
  answers: readonly SaveAnswerPayload[],
): StepData {
  const answersByQuestionId = new Map(
    answers.map(answer => [answer.question_id, answer]),
  );

  return {
    ...currentStepData,
    questions: currentStepData.questions.map(question => {
      const updatedAnswer = answersByQuestionId.get(question.id);

      if (!updatedAnswer) {
        return question;
      }

      if (updatedAnswer.selected_values !== undefined) {
        return {
          ...question,
          answer: {
            values: [...updatedAnswer.selected_values],
          },
        };
      }

      if (updatedAnswer.answer_text !== undefined) {
        return {
          ...question,
          answer: updatedAnswer.answer_text
            ? {text: updatedAnswer.answer_text}
            : null,
        };
      }

      return question;
    }),
  };
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
        const cacheKey = getCacheKey(projectId, step);
        const cached = getCachedStepData(cacheKey);

        if (cached) {
          if (!isDisposed) {
            setError(null);
            setIsLoading(false);
            setStepData(cached);
          }

          return;
        }

        if (!isDisposed) {
          setIsLoading(true);
          setError(null);
        }

        const url = `/api/employer-survey/step/${step}?projectId=${projectId}&admin_token=${adminToken}`;
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
          setError(
            error_ instanceof Error ? error_.message : 'An error occurred',
          );
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

      const url = `/api/employer-survey/step/${step}?projectId=${projectId}&admin_token=${adminToken}`;
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

      const cacheKey = getCacheKey(projectId, step);

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
  };
}
