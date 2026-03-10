import {SurveyAnswerRepository} from '@/lib/repositories/surveyAnswerRepository';
import {SurveyQuestionRepository} from '@/lib/repositories/surveyQuestionRepository';
import {SurveySubmissionRepository} from '@/lib/repositories/surveySubmissionRepository';
import {ValueSelectionRepository} from '@/lib/repositories/valueSelectionRepository';
import {QuestionWithAnswer, StepResponse} from '@/lib/types/survey';

/**
 * Service for employer survey operations
 */
export class EmployerSurveyService {
  private readonly answerRepository: SurveyAnswerRepository;
  private readonly questionRepository: SurveyQuestionRepository;
  private readonly submissionRepository: SurveySubmissionRepository;
  private readonly valueSelectionRepository: ValueSelectionRepository;

  constructor() {
    this.questionRepository = new SurveyQuestionRepository();
    this.submissionRepository = new SurveySubmissionRepository();
    this.answerRepository = new SurveyAnswerRepository();
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
    const questionIds = questions.map((q) => q.id);
    const answersMap = await this.answerRepository.getAnswersByQuestions(
      submission.id,
      questionIds,
    );

    // Get answer IDs that have selections
    const answerIds = Array.from(answersMap.values()).map((a) => a.id);
    const selectionsMap =
      await this.valueSelectionRepository.getSelectionsByAnswers(answerIds);

    // Merge questions with answers
    const questionsWithAnswers: QuestionWithAnswer[] = questions.map((q) => {
      const answer = answersMap.get(q.id);

      if (!answer) {
        return {
          answer: null,
          id: q.id,
          key: q.key,
          prompt: q.prompt,
          question_type: q.question_type,
          selection_limit: q.selection_limit,
        };
      }

      // Build answer object based on question type
      if (
        q.question_type === 'single_select' ||
        q.question_type === 'multi_select'
      ) {
        const values = selectionsMap.get(answer.id) || [];

        return {
          answer: {values},
          id: q.id,
          key: q.key,
          prompt: q.prompt,
          question_type: q.question_type,
          selection_limit: q.selection_limit,
        };
      }

      // text or long_text
      return {
        answer: answer.answer_text ? {text: answer.answer_text} : null,
        id: q.id,
        key: q.key,
        prompt: q.prompt,
        question_type: q.question_type,
        selection_limit: q.selection_limit,
      };
    });

    return {
      questions: questionsWithAnswers,
      step,
    };
  }
}
