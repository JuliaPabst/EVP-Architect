import {ProjectRepository} from '@/lib/repositories/projectRepository';
import {QuestionOptionRepository} from '@/lib/repositories/questionOptionRepository';
import {SurveyAnswerRepository} from '@/lib/repositories/surveyAnswerRepository';
import {SurveyQuestionRepository} from '@/lib/repositories/surveyQuestionRepository';
import {SurveySubmissionRepository} from '@/lib/repositories/surveySubmissionRepository';
import {ValueOptionRepository} from '@/lib/repositories/valueOptionRepository';
import {ValueSelectionRepository} from '@/lib/repositories/valueSelectionRepository';
import {QuestionWithAnswer, StepResponse} from '@/lib/types/survey';
import {AnswerInput} from '@/lib/validation/employerSurveySchemas';

/**
 * Service for employer survey operations
 */
export class EmployerSurveyService {
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
    const questionIds = questions.map((q) => q.id);
    const answersMap = await this.answerRepository.getAnswersByQuestions(
      submission.id,
      questionIds,
    );

    // Get answer IDs that have selections
    const answerIds = Array.from(answersMap.values()).map((a) => a.id);
    const selectionsMap =
      await this.valueSelectionRepository.getSelectionsByAnswers(answerIds);

    // Load options for single_select questions
    const singleSelectKeys = questions
      .filter((q) => q.question_type === 'single_select')
      .map((q) => q.key);
    const questionOptionsMap =
      await this.questionOptionRepository.getOptionsByQuestionKeys(
        singleSelectKeys,
      );

    // Load options for multi_select questions (all value options)
    const hasMultiSelect = questions.some(
      (q) => q.question_type === 'multi_select',
    );
    const multiSelectOptions = hasMultiSelect
      ? await this.valueOptionRepository.getAllValueOptions()
      : [];

    // Merge questions with answers and options
    const questionsWithAnswers: QuestionWithAnswer[] = questions.map((q) => {
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
      let options: Array<{value_key: string; label: string}> | undefined;

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
      (qid) => !answeredSet.has(qid),
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
