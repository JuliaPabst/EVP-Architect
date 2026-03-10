import {SurveyAnswerRepository} from '@/lib/repositories/surveyAnswerRepository';
import {SurveyQuestionRepository} from '@/lib/repositories/surveyQuestionRepository';
import {SurveySubmissionRepository} from '@/lib/repositories/surveySubmissionRepository';
import {ValueSelectionRepository} from '@/lib/repositories/valueSelectionRepository';
import {QuestionWithAnswer, StepResponse} from '@/lib/types/survey';
import {AnswerInput} from '@/lib/validation/employerSurveySchemas';

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
    const questionIds = answers.map((a) => a.question_id);
    const questionsMap =
      await this.questionRepository.getQuestionsByIds(questionIds);

    // Validate all questions exist and belong to this step
    for (const answer of answers) {
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

      // Validate answer based on question type
      if (
        question.question_type === 'text' ||
        question.question_type === 'long_text'
      ) {
        if (!answer.answer_text) {
          throw new Error(
            `answer_text required for question ${answer.question_id}`,
          );
        }

        if (answer.selected_values && answer.selected_values.length > 0) {
          throw new Error(
            `selected_values must be empty for text question ${answer.question_id}`,
          );
        }
      }

      if (question.question_type === 'single_select') {
        if (!answer.selected_values || answer.selected_values.length !== 1) {
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

      if (question.question_type === 'multi_select') {
        if (!answer.selected_values || answer.selected_values.length === 0) {
          throw new Error(
            `At least 1 value required for multi_select question ${answer.question_id}`,
          );
        }

        if (
          question.selection_limit &&
          answer.selected_values.length > question.selection_limit
        ) {
          throw new Error(
            `Too many values for multi_select question ${answer.question_id} (limit: ${question.selection_limit})`,
          );
        }

        if (answer.answer_text) {
          throw new Error(
            `answer_text must be empty for multi_select question ${answer.question_id}`,
          );
        }
      }
    }

    // Process all answers (transaction-like behavior through sequential operations)
    for (const answer of answers) {
      const question = questionsMap.get(answer.question_id)!;

      // Upsert answer
      const savedAnswer = await this.answerRepository.upsertAnswer(
        submission.id,
        answer.question_id,
        answer.answer_text || null,
      );

      // Handle value selections
      if (
        question.question_type === 'single_select' ||
        question.question_type === 'multi_select'
      ) {
        // Delete existing selections
        await this.valueSelectionRepository.deleteSelectionsByAnswer(
          savedAnswer.id,
        );

        // Insert new selections
        if (answer.selected_values && answer.selected_values.length > 0) {
          await this.valueSelectionRepository.insertSelections(
            savedAnswer.id,
            answer.selected_values,
          );
        }
      }
    }
  }
}
