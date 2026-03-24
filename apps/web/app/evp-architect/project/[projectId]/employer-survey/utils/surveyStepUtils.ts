import type {SurveyQuestion as Question} from '@/lib/utils/surveyStepUtils';

export type {
  FocusOption,
  SurveyQuestion as Question,
} from '@/lib/utils/surveyStepUtils';
export {
  buildAnswersPayload,
  extractMultiSelectValues,
  extractTextValue,
  findQuestionByType,
  findTextQuestion,
  transformOptionsForSelection,
} from '@/lib/utils/surveyStepUtils';

/**
 * Build text answers payload for steps with multiple text questions
 */
export function buildTextAnswersPayload(
  questions: readonly Question[],
  textAnswers: Record<string, string>,
): {
  readonly answer_text: string;
  readonly question_id: string;
}[] {
  return questions
    .filter(q => textAnswers[q.id]?.trim())
    .map(q => ({
      answer_text: textAnswers[q.id],
      question_id: q.id,
    }));
}

/**
 * Build the URL for navigating to the next step with admin token
 */
export function buildStepUrl(
  projectId: string,
  step: number,
  adminToken: string | null,
): string {
  const baseUrl = `/evp-architect/project/${projectId}/employer-survey/step-${step}`;

  return adminToken ? `${baseUrl}?admin=${adminToken}` : baseUrl;
}

/**
 * Build the URL for navigating back to project overview
 */
export function buildProjectUrl(projectId: string): string {
  return `/evp-architect/project/${projectId}`;
}
