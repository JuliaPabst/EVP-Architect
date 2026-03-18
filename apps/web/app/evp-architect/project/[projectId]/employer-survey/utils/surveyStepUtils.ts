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
 * Build the answers payload for API submission
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

  // Add multi-select answer
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

  // Add text answer
  if (params.textQuestion && params.textValue?.trim()) {
    answers.push({
      answer_text: params.textValue,
      question_id: params.textQuestion.id,
    });
  }

  return answers;
}

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
