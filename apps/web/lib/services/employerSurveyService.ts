import {ProjectRepository} from '@/lib/repositories/projectRepository';
import {QuestionOptionRepository} from '@/lib/repositories/questionOptionRepository';
import {SelectionOptionRepository} from '@/lib/repositories/selectionOptionRepository';
import {SurveyAnswerRepository} from '@/lib/repositories/surveyAnswerRepository';
import {SurveyQuestionRepository} from '@/lib/repositories/surveyQuestionRepository';
import {SurveySubmissionRepository} from '@/lib/repositories/surveySubmissionRepository';
import {ValueSelectionRepository} from '@/lib/repositories/valueSelectionRepository';
import {StepResponse, SurveyQuestion} from '@/lib/types/survey';
import {AnswerInput} from '@/lib/validation/surveySchemas';
import {
  buildStepData,
  processAnswer,
  validateMultiSelectAnswer,
  validateTextAnswer,
} from './surveyServiceHelpers';

/**
 * Service for employer survey operations
 */
class EmployerSurveyService {
  private readonly answerRepository: SurveyAnswerRepository;

  private readonly projectRepository: ProjectRepository;

  private readonly questionRepository: SurveyQuestionRepository;

  private readonly questionOptionRepository: QuestionOptionRepository;

  private readonly submissionRepository: SurveySubmissionRepository;

  private readonly selectionOptionRepository: SelectionOptionRepository;

  private readonly valueSelectionRepository: ValueSelectionRepository;

  constructor() {
    this.projectRepository = new ProjectRepository();
    this.questionRepository = new SurveyQuestionRepository();
    this.questionOptionRepository = new QuestionOptionRepository();
    this.submissionRepository = new SurveySubmissionRepository();
    this.answerRepository = new SurveyAnswerRepository();
    this.selectionOptionRepository = new SelectionOptionRepository();
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
    const [questions, submission] = await Promise.all([
      this.questionRepository.getQuestionsByStep('employer', step),
      this.submissionRepository.getOrCreateEmployerSubmission(projectId),
    ]);

    return buildStepData(
      submission.id,
      step,
      questions,
      this.answerRepository,
      this.questionOptionRepository,
      this.selectionOptionRepository,
      this.valueSelectionRepository,
    );
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
      validateTextAnswer(answer);
      return;
    }

    if (question.question_type === 'single_select') {
      EmployerSurveyService.validateSingleSelectAnswer(answer);
      return;
    }

    if (question.question_type === 'multi_select') {
      validateMultiSelectAnswer(answer, question.selection_limit);
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
    const submission =
      await this.submissionRepository.getOrCreateEmployerSubmission(projectId);

    const questionIds = answers.map(a => a.question_id);
    const questionsMap =
      await this.questionRepository.getQuestionsByIds(questionIds);

    for (const answer of answers) {
      EmployerSurveyService.validateQuestionExists(answer, questionsMap, step);
      const question = questionsMap.get(answer.question_id)!;

      EmployerSurveyService.validateAnswerForQuestionType(answer, question);
    }

    await answers.reduce(async (previousPromise, answer) => {
      await previousPromise;
      const question = questionsMap.get(answer.question_id)!;

      await processAnswer(
        submission.id,
        answer,
        question,
        this.answerRepository,
        this.valueSelectionRepository,
      );
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
    if (projectStatus !== 'employer_survey_in_progress') {
      throw new Error('invalid_project_state');
    }

    const submission = await this.submissionRepository.findSubmission(
      projectId,
      'employer',
    );

    if (!submission) {
      throw new Error('no_submission_found');
    }

    if (submission.status === 'submitted') {
      throw new Error('already_completed');
    }

    const allQuestionIds =
      await this.questionRepository.getAllQuestionIds('employer');

    const answeredQuestionIds =
      await this.answerRepository.getAnsweredQuestionIds(submission.id);

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

    try {
      await this.submissionRepository.markAsSubmitted(submission.id);

      await this.projectRepository.updateStatus(
        projectId,
        'employer_survey_completed',
      );
    } catch (error) {
      throw new Error(`Failed to complete survey: ${(error as Error).message}`);
    }
  }
}

export default EmployerSurveyService;
