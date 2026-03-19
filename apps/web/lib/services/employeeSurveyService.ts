import {QuestionOptionRepository} from '@/lib/repositories/questionOptionRepository';
import {SelectionOptionRepository} from '@/lib/repositories/selectionOptionRepository';
import {SurveyAnswerRepository} from '@/lib/repositories/surveyAnswerRepository';
import {SurveyQuestionRepository} from '@/lib/repositories/surveyQuestionRepository';
import {SurveySubmissionRepository} from '@/lib/repositories/surveySubmissionRepository';
import {ValueSelectionRepository} from '@/lib/repositories/valueSelectionRepository';
import {QuestionWithAnswer, StepResponse, SurveyQuestion} from '@/lib/types/survey';
import {AnswerInput} from '@/lib/validation/employeeSurveySchemas';

/**
 * Service for employee survey operations
 */
class EmployeeSurveyService {
  private readonly answerRepository: SurveyAnswerRepository;

  private readonly questionRepository: SurveyQuestionRepository;

  private readonly questionOptionRepository: QuestionOptionRepository;

  private readonly submissionRepository: SurveySubmissionRepository;

  private readonly selectionOptionRepository: SelectionOptionRepository;

  private readonly valueSelectionRepository: ValueSelectionRepository;

  constructor() {
    this.questionRepository = new SurveyQuestionRepository();
    this.questionOptionRepository = new QuestionOptionRepository();
    this.submissionRepository = new SurveySubmissionRepository();
    this.answerRepository = new SurveyAnswerRepository();
    this.selectionOptionRepository = new SelectionOptionRepository();
    this.valueSelectionRepository = new ValueSelectionRepository();
  }

  /**
   * Get or create a submission for an employee
   *
   * @param submissionId - Existing submission UUID from client (nullable)
   * @param projectId - Project UUID
   * @returns Submission with its ID
   */
  async getOrCreateSubmission(
    submissionId: string | null,
    projectId: string,
  ): Promise<{id: string}> {
    const submission =
      await this.submissionRepository.getOrCreateEmployeeSubmission(
        submissionId,
        projectId,
      );

    return {id: submission.id};
  }

  /**
   * Get questions and answers for a specific step
   *
   * @param submissionId - Employee submission UUID
   * @param step - Step number (1-5)
   * @returns Step response with questions and answers
   */
  async getStepData(submissionId: string, step: number): Promise<StepResponse> {
    const questions = await this.questionRepository.getQuestionsByStep(
      'employee',
      step,
    );

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

    const answersPromise = this.answerRepository.getAnswersByQuestions(
      submissionId,
      questionIds,
    );
    const questionOptionsPromise =
      singleSelectKeys.length > 0
        ? this.questionOptionRepository.getOptionsByQuestionKeys(singleSelectKeys)
        : Promise.resolve(new Map<string, {label: string; value_key: string}[]>());
    const allSelectionOptionsPromise = shouldFetchAllSelectionOptions
      ? this.selectionOptionRepository.getAllOptions()
      : Promise.resolve([]);
    const valueSelectionOptionsPromise = shouldFetchValueSelectionOptions
      ? this.selectionOptionRepository.getOptionsByType('value')
      : Promise.resolve([]);
    const areaSelectionOptionsPromise = shouldFetchAreaSelectionOptions
      ? this.selectionOptionRepository.getOptionsByType('area')
      : Promise.resolve([]);

    const answersMap = await answersPromise;
    const answerIds = Array.from(answersMap.values()).map(answer => answer.id);
    const selectionsPromise =
      this.valueSelectionRepository.getSelectionsByAnswers(answerIds);

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
   * Validate question exists and belongs to the employee survey step
   */
  private static validateQuestionExists(
    answer: AnswerInput,
    questionsMap: Map<string, SurveyQuestion>,
    step: number,
  ): void {
    const question = questionsMap.get(answer.question_id);

    if (!question) {
      throw new Error(`Question not found: ${answer.question_id}`);
    }

    if (question.survey_type !== 'employee') {
      throw new Error(`Question is not an employee question`);
    }

    if (question.step !== step) {
      throw new Error(`Question does not belong to step ${step}`);
    }
  }

  /**
   * Validate text or long_text answer
   */
  private static validateTextAnswer(answer: AnswerInput): void {
    if (answer.answer_text === undefined) {
      throw new Error(
        `answer_text required for question ${answer.question_id}`,
      );
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
  private static validateMultiSelectAnswer(
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
   * Validate answer based on question type
   */
  private static validateAnswerForQuestionType(
    answer: AnswerInput,
    question: SurveyQuestion,
  ): void {
    const isTextType =
      question.question_type === 'text' ||
      question.question_type === 'long_text';

    if (isTextType) {
      EmployeeSurveyService.validateTextAnswer(answer);
      return;
    }

    if (question.question_type === 'multi_select') {
      EmployeeSurveyService.validateMultiSelectAnswer(
        answer,
        question.selection_limit,
      );
    }
  }

  /**
   * Process a single answer (upsert and handle selections)
   */
  private async processAnswer(
    submissionId: string,
    answer: AnswerInput,
    question: SurveyQuestion,
  ): Promise<void> {
    const savedAnswer = await this.answerRepository.upsertAnswer(
      submissionId,
      answer.question_id,
      answer.answer_text || null,
    );

    const isSelectType = question.question_type === 'multi_select';

    if (isSelectType) {
      await this.valueSelectionRepository.deleteSelectionsByAnswer(
        savedAnswer.id,
      );

      if (answer.selected_values && answer.selected_values.length > 0) {
        await this.valueSelectionRepository.insertSelections(
          savedAnswer.id,
          answer.selected_values,
        );
      }
    }
  }

  /**
   * Save answers for a specific step
   *
   * @param submissionId - Employee submission UUID
   * @param step - Step number (1-5)
   * @param answers - Array of answer inputs
   * @throws Error if validation fails or questions don't belong to step
   */
  async saveStepAnswers(
    submissionId: string,
    step: number,
    answers: readonly AnswerInput[],
  ): Promise<void> {
    const questionIds = answers.map(a => a.question_id);
    const questionsMap =
      await this.questionRepository.getQuestionsByIds(questionIds);

    for (const answer of answers) {
      EmployeeSurveyService.validateQuestionExists(answer, questionsMap, step);
      const question = questionsMap.get(answer.question_id)!;

      EmployeeSurveyService.validateAnswerForQuestionType(answer, question);
    }

    await answers.reduce(async (previousPromise, answer) => {
      await previousPromise;
      const question = questionsMap.get(answer.question_id)!;

      await this.processAnswer(submissionId, answer, question);
    }, Promise.resolve());
  }
}

export default EmployeeSurveyService;
