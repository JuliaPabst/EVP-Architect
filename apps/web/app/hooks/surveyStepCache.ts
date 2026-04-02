export interface QuestionOption {
  readonly label: string;
  readonly value_key: string;
}

export interface StepQuestion {
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

export interface StepData {
  readonly questions: readonly StepQuestion[];
  readonly step: number;
}

export interface SaveAnswerPayload {
  readonly question_id: string;
  readonly answer_text?: string;
  readonly selected_values?: readonly string[];
}

export const inFlightStepRequests = new Map<string, Promise<StepData>>();

export const stepDataCache = new Map<string, StepData>();

export function getCachedStepData(key: string): StepData | undefined {
  return stepDataCache.get(key);
}

export function setCachedStepData(key: string, data: StepData): void {
  stepDataCache.set(key, data);
}

export async function fetchStepFromApi(
  url: string,
  adminToken?: string | null,
): Promise<StepData> {
  const headers: Record<string, string> = {};

  if (adminToken) {
    headers['x-admin-token'] = adminToken;
  }

  const response = await fetch(url, {cache: 'no-store', headers});

  if (!response.ok) {
    const errorData = await response.json();

    throw new Error(errorData.message || 'Failed to fetch survey data');
  }

  return (await response.json()) as StepData;
}

export function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : 'An error occurred';
}

export function mergeSavedAnswers(
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
