import {ProjectRepository} from '@/lib/repositories/projectRepository';
import {QuestionOptionRepository} from '@/lib/repositories/questionOptionRepository';
import {SurveyAnswerRepository} from '@/lib/repositories/surveyAnswerRepository';
import {SurveyQuestionRepository} from '@/lib/repositories/surveyQuestionRepository';
import {SurveySubmissionRepository} from '@/lib/repositories/surveySubmissionRepository';
import {ValueOptionRepository} from '@/lib/repositories/valueOptionRepository';
import {ValueSelectionRepository} from '@/lib/repositories/valueSelectionRepository';
import {
  QuestionWithAnswer,
  StepResponse,
  SurveyQuestion,
} from '@/lib/types/survey';
import {AnswerInput} from '@/lib/validation/employerSurveySchemas';

// Export as default to satisfy linting rules

/**
 * Service for employer survey operations
 */
class EmployerSurveyService {
  private readonly answerRepository: SurveyAnswerRepository;

  private readonly projectRepository: ProjectRepository;

  private readonly questionRepository: SurveyQuestionRepository;

  private readonly questionOptionRepository: QuestionOptionRepository;

  private readonly submissionRepository: SurveySubmissionRepository;

  private readonly valueOptionRepository: ValueOptionRepository;

  private readonly valueSelectionRepository: ValueSelectionRepository;

  constructor() {
    this.projectRepository = new ProjectRepository();
    this.questionRepository = new SurveyQuestionRepository();
    this.questionOptionRepository = new QuestionOptionRepository();
    this.submissionRepository = new SurveySubmissionRepository();
    this.answerRepository = new SurveyAnswerRepository();
    this.valueOptionRepository = new ValueOptionRepository();
    this.valueSelectionRepository = new ValueSelectionRepository();
  }

  /**
   * Get questions and answers for a specific step
   *
   * @param projectId - Project UUID
   * @param step - Step number (1-5)
   * @returns Step response with questions and answers
   */
  async getStepData(projectId: string, step: number): Promise<StepResponse> {
    // Fetch questions for this step
    const questions = await this.questionRepository.getQuestionsByStep(
      'employer',
      step,
    );

    // Get or create employer submission
    const submission =
      await this.submissionRepository.getOrCreateEmployerSubmission(projectId);

    // Fetch existing answers for these questions
    const questionIds = questions.map(q => q.id);
    const answersMap = await this.answerRepository.getAnswersByQuestions(
      submission.id,
      questionIds,
    );

    // Get answer IDs that have selections
    const answerIds = Array.from(answersMap.values()).map(a => a.id);
    const selectionsMap =
      await this.valueSelectionRepository.getSelectionsByAnswers(answerIds);

    // Load options for single_select questions
    const singleSelectKeys = questions
      .filter(q => q.question_type === 'single_select')
      .map(q => q.key);
    const questionOptionsMap =
      await this.questionOptionRepository.getOptionsByQuestionKeys(
        singleSelectKeys,
      );

    // Load options for multi_select questions (all value options)
    const hasMultiSelect = questions.some(
      q => q.question_type === 'multi_select',
    );
    const multiSelectOptions = hasMultiSelect
      ? await this.valueOptionRepository.getAllValueOptions()
      : [];

    // Merge questions with answers and options
    const questionsWithAnswers: QuestionWithAnswer[] = questions.map(q => {
      const answer = answersMap.get(q.id);

      // Base question fields
      const baseQuestion = {
        id: q.id,
        key: q.key,
        prompt: q.prompt,
        question_type: q.question_type,
        selection_limit: q.selection_limit,
      };

      // Add options for select-type questions
      let options: {label: string; value_key: string}[] | undefined;

      if (q.question_type === 'single_select') {
        options = questionOptionsMap.get(q.key) || [];
      } else if (q.question_type === 'multi_select') {
        options = multiSelectOptions;
      }

      if (!answer) {
        return {
          ...baseQuestion,
          answer: null,
          ...(options && {options}),
        };
      }

      // Build answer object based on question type
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

      // text or long_text
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
   * Validate question exists and belongs to the step
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

    if (question.survey_type !== 'employer') {
      throw new Error(`Question is not an employer question`);
    }

    if (question.step !== step) {
      throw new Error(`Question does not belong to step ${step}`);
    }
  }

  /**
   * Validate text or long_text answer
   */
  private static validateTextAnswer(answer: AnswerInput): void {
    if (!answer.answer_text) {
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
   * Validate single_select answer
   */
  private static validateSingleSelectAnswer(answer: AnswerInput): void {
    if (answer.selected_values?.length !== 1) {
      throw new Error(
        `Exactly 1 value required for single_select question ${answer.question_id}`,
      );
    }

    if (answer.answer_text) {
      throw new Error(
        `answer_text must be empty for single_select question ${answer.question_id}`,
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
      EmployerSurveyService.validateTextAnswer(answer);
      return;
    }

    if (question.question_type === 'single_select') {
      EmployerSurveyService.validateSingleSelectAnswer(answer);
      return;
    }

    if (question.question_type === 'multi_select') {
      EmployerSurveyService.validateMultiSelectAnswer(
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
    // Upsert answer
    const savedAnswer = await this.answerRepository.upsertAnswer(
      submissionId,
      answer.question_id,
      answer.answer_text || null,
    );

    // Handle value selections for select-type questions
    const isSelectType =
      question.question_type === 'single_select' ||
      question.question_type === 'multi_select';

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
   * @param projectId - Project UUID
   * @param step - Step number (1-5)
   * @param answers - Array of answer inputs
   * @throws Error if validation fails or questions don't belong to step
   */
  async saveStepAnswers(
    projectId: string,
    step: number,
    answers: readonly AnswerInput[],
  ): Promise<void> {
    // Get or create employer submission
    const submission =
      await this.submissionRepository.getOrCreateEmployerSubmission(projectId);

    // Fetch all questions by IDs
    const questionIds = answers.map(a => a.question_id);
    const questionsMap =
      await this.questionRepository.getQuestionsByIds(questionIds);

    // Validate all questions and answers
    for (const answer of answers) {
      EmployerSurveyService.validateQuestionExists(answer, questionsMap, step);
      const question = questionsMap.get(answer.question_id)!;

      EmployerSurveyService.validateAnswerForQuestionType(answer, question);
    }

    // Process all answers (transaction-like behavior through sequential operations)
    await answers.reduce(async (previousPromise, answer) => {
      await previousPromise;
      const question = questionsMap.get(answer.question_id)!;

      await this.processAnswer(submission.id, answer, question);
    }, Promise.resolve());
  }

  /**
   * Complete employer survey
   *
   * Validates all questions are answered and updates submission + project status
   *
   * @param projectId - Project UUID
   * @param projectStatus - Current project status
   * @throws Error with specific code for validation failures
   */
  async completeEmployerSurvey(
    projectId: string,
    projectStatus: string,
  ): Promise<void> {
    // Validate project state
    if (projectStatus !== 'employer_survey_in_progress') {
      throw new Error('invalid_project_state');
    }

    // Fetch employer submission
    const submission = await this.submissionRepository.findSubmission(
      projectId,
      'employer',
    );

    if (!submission) {
      throw new Error('no_submission_found');
    }

    // Check if already completed
    if (submission.status === 'submitted') {
      throw new Error('already_completed');
    }

    // Fetch all employer question IDs
    const allQuestionIds =
      await this.questionRepository.getAllQuestionIds('employer');

    // Fetch answered question IDs
    const answeredQuestionIds =
      await this.answerRepository.getAnsweredQuestionIds(submission.id);

    // Find missing questions
    const answeredSet = new Set(answeredQuestionIds);
    const missingQuestionIds = allQuestionIds.filter(
      qid => !answeredSet.has(qid),
    );

    if (missingQuestionIds.length > 0) {
      const error = new Error('missing_required_questions') as Error & {
        missing_question_ids?: string[];
      };

      error.missing_question_ids = missingQuestionIds;

      throw error;
    }

    // Atomic updates (note: in production, wrap in PostgreSQL function for true atomicity)
    try {
      // Update submission status
      await this.submissionRepository.markAsSubmitted(submission.id);

      // Update project status
      await this.projectRepository.updateStatus(
        projectId,
        'employer_survey_completed',
      );
    } catch (error) {
      // If either operation fails, throw error
      // In production, this should be wrapped in a database transaction
      throw new Error(`Failed to complete survey: ${(error as Error).message}`);
    }
  }
}

export default EmployerSurveyService;
