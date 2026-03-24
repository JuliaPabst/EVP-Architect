export type {FocusOption, SurveyQuestion as Question} from '@/lib/utils/surveyStepUtils';
export {
  buildAnswersPayload,
  extractMultiSelectValues,
  extractTextValue,
  findQuestionByType,
  findTextQuestion,
  transformOptionsForSelection,
} from '@/lib/utils/surveyStepUtils';

import type {SurveyQuestion as Question} from '@/lib/utils/surveyStepUtils';

/**
 * Build the answers payload for a multi-select question
 */
export function buildMultiSelectAnswerPayload(params: {
  readonly multiSelectQuestion: Question;
  readonly selectedValues: readonly string[];
}): {
  readonly question_id: string;
  readonly selected_values: readonly string[];
}[] {
  if (params.selectedValues.length === 0) {
    return [];
  }

  return [
    {
      question_id: params.multiSelectQuestion.id,
      selected_values: params.selectedValues,
    },
  ];
}

/**
 * Build text answers payload for steps with a single text question
 */
export function buildTextAnswerPayload(
  question: Question,
  textValue: string,
): {readonly answer_text: string; readonly question_id: string}[] {
  if (!textValue.trim()) {
    return [];
  }

  return [{answer_text: textValue, question_id: question.id}];
}

/**
 * Build the URL for navigating to a specific step
 */
export function buildStepUrl(projectId: string, step: number): string {
  return `/evp-architect/project/${projectId}/employee-survey/step-${step}`;
}

/**
 * Build the URL for the survey completion page
 */
export function buildCompleteUrl(projectId: string): string {
  return `/evp-architect/project/${projectId}/employee-survey/complete`;
}
