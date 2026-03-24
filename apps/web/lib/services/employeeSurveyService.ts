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

    return buildStepData(
      submissionId,
      step,
      questions,
      this.answerRepository,
      this.questionOptionRepository,
      this.selectionOptionRepository,
      this.valueSelectionRepository,
    );
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

    if (question.question_type === 'multi_select') {
      validateMultiSelectAnswer(answer, question.selection_limit);
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

      await processAnswer(
        submissionId,
        answer,
        question,
        this.answerRepository,
        this.valueSelectionRepository,
      );
    }, Promise.resolve());
  }
}

export default EmployeeSurveyService;
