import {QuestionOptionRepository} from '@/lib/repositories/questionOptionRepository';
import {SelectionOptionRepository} from '@/lib/repositories/selectionOptionRepository';
import {SurveyAnswerRepository} from '@/lib/repositories/surveyAnswerRepository';
import {ValueSelectionRepository} from '@/lib/repositories/valueSelectionRepository';
import {
  QuestionWithAnswer,
  StepResponse,
  SurveyQuestion,
} from '@/lib/types/survey';
import {AnswerInput} from '@/lib/validation/surveySchemas';

/**
 * Fetch and assemble step data given already-fetched questions and a submission ID.
 * Shared between employee and employer survey services.
 */
export async function buildStepData(
  submissionId: string,
  step: number,
  questions: readonly SurveyQuestion[],
  answerRepository: SurveyAnswerRepository,
  questionOptionRepository: QuestionOptionRepository,
  selectionOptionRepository: SelectionOptionRepository,
  valueSelectionRepository: ValueSelectionRepository,
): Promise<StepResponse> {
  const questionIds = questions.map(q => q.id);
  const singleSelectKeys = questions
    .filter(q => q.question_type === 'single_select')
    .map(q => q.key);

  const hasCoreValuesQuestion = questions.some(
    q => q.question_type === 'multi_select' && q.key === 'core_values',
  );
  const hasExcludeValuesQuestion = questions.some(
    q => q.question_type === 'multi_select' && q.key === 'exclude_values',
  );
  const hasFallbackMultiSelectQuestion = questions.some(
    q =>
      q.question_type === 'multi_select' &&
      q.key !== 'core_values' &&
      q.key !== 'exclude_values',
  );

  const shouldFetchAllSelectionOptions = hasFallbackMultiSelectQuestion;
  const shouldFetchValueSelectionOptions =
    !shouldFetchAllSelectionOptions && hasCoreValuesQuestion;
  const shouldFetchAreaSelectionOptions =
    !shouldFetchAllSelectionOptions && hasExcludeValuesQuestion;

  const answersPromise = answerRepository.getAnswersByQuestions(
    submissionId,
    questionIds,
  );
  const questionOptionsPromise =
    singleSelectKeys.length > 0
      ? questionOptionRepository.getOptionsByQuestionKeys(singleSelectKeys)
      : Promise.resolve(
          new Map<string, {label: string; value_key: string}[]>(),
        );
  const allSelectionOptionsPromise = shouldFetchAllSelectionOptions
    ? selectionOptionRepository.getAllOptions()
    : Promise.resolve([]);
  const valueSelectionOptionsPromise = shouldFetchValueSelectionOptions
    ? selectionOptionRepository.getOptionsByType('value')
    : Promise.resolve([]);
  const areaSelectionOptionsPromise = shouldFetchAreaSelectionOptions
    ? selectionOptionRepository.getOptionsByType('area')
    : Promise.resolve([]);

  const answersMap = await answersPromise;
  const answerIds = Array.from(answersMap.values()).map(answer => answer.id);
  const selectionsPromise =
    valueSelectionRepository.getSelectionsByAnswers(answerIds);

  const [
    selectionsMap,
    questionOptionsMap,
    allSelectionOptions,
    valueSelectionOptions,
    areaSelectionOptions,
  ] = await Promise.all([
    selectionsPromise,
    questionOptionsPromise,
    allSelectionOptionsPromise,
    valueSelectionOptionsPromise,
    areaSelectionOptionsPromise,
  ]);

  const mapSelectionOptions = (
    selectionOptions: readonly {key: string; label_de: string}[],
  ) =>
    selectionOptions.map(option => ({
      label: option.label_de,
      value_key: option.key,
    }));

  const questionsWithAnswers: QuestionWithAnswer[] = questions.map(q => {
    const answer = answersMap.get(q.id);

    const baseQuestion = {
      id: q.id,
      key: q.key,
      prompt: q.prompt,
      question_type: q.question_type,
      selection_limit: q.selection_limit,
    };

    let options: {label: string; value_key: string}[] | undefined;

    if (q.question_type === 'single_select') {
      options = questionOptionsMap.get(q.key) || [];
    } else if (q.question_type === 'multi_select') {
      if (shouldFetchAllSelectionOptions) {
        options = mapSelectionOptions(allSelectionOptions);
      } else if (q.key === 'core_values') {
        options = mapSelectionOptions(valueSelectionOptions);
      } else if (q.key === 'exclude_values') {
        options = mapSelectionOptions(areaSelectionOptions);
      } else {
        options = [];
      }
    }

    if (!answer) {
      return {
        ...baseQuestion,
        answer: null,
        ...(options && {options}),
      };
    }

    if (
      q.question_type === 'single_select' ||
      q.question_type === 'multi_select'
    ) {
      const values = selectionsMap.get(answer.id) || [];

      return {
        ...baseQuestion,
        answer: {values},
        ...(options && {options}),
      };
    }

    return {
      ...baseQuestion,
      answer: answer.answer_text ? {text: answer.answer_text} : null,
    };
  });

  return {
    questions: questionsWithAnswers,
    step,
  };
}

/**
 * Validate text or long_text answer
 */
export function validateTextAnswer(answer: AnswerInput): void {
  if (answer.answer_text === undefined) {
    throw new Error(`answer_text required for question ${answer.question_id}`);
  }

  if ((answer.selected_values?.length ?? 0) > 0) {
    throw new Error(
      `selected_values must be empty for text question ${answer.question_id}`,
    );
  }
}

/**
 * Validate multi_select answer
 */
export function validateMultiSelectAnswer(
  answer: AnswerInput,
  selectionLimit: number | null,
): void {
  if (!answer.selected_values?.length) {
    throw new Error(
      `At least 1 value required for multi_select question ${answer.question_id}`,
    );
  }

  if (selectionLimit && answer.selected_values.length > selectionLimit) {
    throw new Error(
      `Too many values for multi_select question ${answer.question_id} (limit: ${selectionLimit})`,
    );
  }

  if (answer.answer_text) {
    throw new Error(
      `answer_text must be empty for multi_select question ${answer.question_id}`,
    );
  }
}

/**
 * Upsert an answer and sync value selections for select-type questions.
 * Shared between employee and employer survey services.
 */
export async function processAnswer(
  submissionId: string,
  answer: AnswerInput,
  question: SurveyQuestion,
  answerRepository: SurveyAnswerRepository,
  valueSelectionRepository: ValueSelectionRepository,
): Promise<void> {
  const savedAnswer = await answerRepository.upsertAnswer(
    submissionId,
    answer.question_id,
    answer.answer_text || null,
  );

  const isSelectType =
    question.question_type === 'single_select' ||
    question.question_type === 'multi_select';

  if (isSelectType) {
    await valueSelectionRepository.deleteSelectionsByAnswer(savedAnswer.id);

    if (answer.selected_values && answer.selected_values.length > 0) {
      await valueSelectionRepository.insertSelections(
        savedAnswer.id,
        answer.selected_values,
      );
    }
  }
}
