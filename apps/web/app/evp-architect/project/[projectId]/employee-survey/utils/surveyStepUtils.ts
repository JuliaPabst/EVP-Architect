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
  readonly options?: readonly {
    readonly label: string;
    readonly value_key: string;
  }[];
}

interface FocusOption {
  readonly id: string;
  readonly label: string;
}

/**
 * Find a question by its type from a list of questions
 */
export function findQuestionByType(
  questions: readonly Question[] | undefined,
  questionType: string,
): Question | undefined {
  return questions?.find(q => q.question_type === questionType);
}

/**
 * Find any text-based question (text or long_text)
 */
export function findTextQuestion(
  questions: readonly Question[] | undefined,
): Question | undefined {
  return questions?.find(
    q => q.question_type === 'text' || q.question_type === 'long_text',
  );
}

/**
 * Transform API options to the format expected by FocusSelection component
 */
export function transformOptionsForSelection(
  options?: readonly {readonly label: string; readonly value_key: string}[],
): readonly FocusOption[] {
  return options?.map(opt => ({id: opt.value_key, label: opt.label})) || [];
}

/**
 * Extract initial multi-select values from a question's answer
 */
export function extractMultiSelectValues(
  question: Question | undefined,
): string[] {
  if (question?.answer?.values) {
    return [...question.answer.values];
  }
  return [];
}

/**
 * Extract initial text value from a question's answer
 */
export function extractTextValue(question: Question | undefined): string {
  return question?.answer?.text || '';
}

/**
 * Build the answers payload for API submission (multi-select + optional text)
 */
export function buildAnswersPayload(params: {
  readonly multiSelectQuestion?: Question;
  readonly selectedValues?: readonly string[];
  readonly textQuestion?: Question;
  readonly textValue?: string;
}): {
  readonly question_id: string;
  readonly answer_text?: string;
  readonly selected_values?: readonly string[];
}[] {
  const answers = [];

  if (
    params.multiSelectQuestion &&
    params.selectedValues &&
    params.selectedValues.length > 0
  ) {
    answers.push({
      question_id: params.multiSelectQuestion.id,
      selected_values: params.selectedValues,
    });
  }

  if (params.textQuestion && params.textValue?.trim()) {
    answers.push({
      answer_text: params.textValue,
      question_id: params.textQuestion.id,
    });
  }

  return answers;
}

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
