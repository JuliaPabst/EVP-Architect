import {useEffect, useState} from 'react';

interface QuestionOption {
  readonly value_key: string;
  readonly label: string;
}

interface Question {
  readonly id: string;
  readonly key: string;
  readonly prompt: string;
  readonly question_type: string;
  readonly selection_limit: number | null;
  readonly options?: readonly QuestionOption[];
  readonly answer?: {
    readonly text?: string;
    readonly values?: readonly string[];
  } | null;
}

interface StepData {
  readonly step: number;
  readonly questions: readonly Question[];
}

interface UseEmployerSurveyStepResult {
  readonly error: string | null;
  readonly isLoading: boolean;
  readonly isSaving: boolean;
  readonly saveAnswers: (answers: SaveAnswerPayload[]) => Promise<void>;
  readonly stepData: StepData | null;
}

interface SaveAnswerPayload {
  readonly question_id: string;
  readonly answer_text?: string;
  readonly selected_values?: readonly string[];
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
    const fetchStepData = async () => {
      if (!adminToken) {
        setError('Authentication token is missing');
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        setError(null);

        const url = `/api/employer-survey/step/${step}?projectId=${projectId}&admin_token=${adminToken}`;
        const response = await fetch(url);

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Failed to fetch survey data');
        }

        const data: StepData = await response.json();
        setStepData(data);
      } catch (error_) {
        setError(error_ instanceof Error ? error_.message : 'An error occurred');
      } finally {
        setIsLoading(false);
      }
    };

    void fetchStepData();
  }, [projectId, step, adminToken]);

  const saveAnswers = async (answers: SaveAnswerPayload[]): Promise<void> => {
    if (!adminToken) {
      throw new Error('Authentication token is missing');
    }

    try {
      setIsSaving(true);
      setError(null);

      const url = `/api/employer-survey/step/${step}?projectId=${projectId}&admin_token=${adminToken}`;
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({answers}),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to save survey data');
      }
    } catch (error_) {
      const errorMessage = error_ instanceof Error ? error_.message : 'Failed to save data';
      setError(errorMessage);
      throw new Error(errorMessage);
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
