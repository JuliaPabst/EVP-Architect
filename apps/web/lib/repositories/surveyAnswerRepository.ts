import {supabase} from '@/lib/supabase';
import {EvpQuestionType} from '@/lib/types/database';
import {SurveyAnswer} from '@/lib/types/survey';

export interface AnswerWithQuestion extends SurveyAnswer {
  question: {
    key: string;
    prompt: string;
    question_type: EvpQuestionType;
  };
}

/**
 * Repository for survey answers table operations
 */
// eslint-disable-next-line import/prefer-default-export
export class SurveyAnswerRepository {
  /**
   * Fetch answers for specific questions in a submission
   *
   * @param submissionId - Submission UUID
   * @param questionIds - Array of question UUIDs
   * @returns Map of question_id -> answer
   */
  async getAnswersByQuestions(
    submissionId: string,
    questionIds: readonly string[],
  ): Promise<Map<string, SurveyAnswer>> {
    if (questionIds.length === 0) {
      return new Map();
    }

    const {data, error} = await supabase
      .from('evp_survey_answers')
      .select('*')
      .eq('submission_id', submissionId)
      .in('question_id', questionIds as string[]);

    if (error) {
      throw new Error(`Failed to fetch answers: ${error.message}`);
    }

    const answerMap = new Map<string, SurveyAnswer>();

    for (const answer of data || []) {
      answerMap.set(answer.question_id, answer);
    }

    return answerMap;
  }

  /**
   * Upsert an answer (insert or update based on unique constraint)
   *
   * @param submissionId - Submission UUID
   * @param questionId - Question UUID
   * @param answerText - Text answer (for text/long_text questions)
   * @returns Created or updated answer
   */
  async upsertAnswer(
    submissionId: string,
    questionId: string,
    answerText: string | null,
  ): Promise<SurveyAnswer> {
    const {data, error} = await supabase
      .from('evp_survey_answers')
      .upsert(
        {
          answer_text: answerText,
          question_id: questionId,
          submission_id: submissionId,
        },
        {
          onConflict: 'submission_id,question_id',
        },
      )
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to upsert answer: ${error.message}`);
    }

    return data;
  }

  /**
   * Fetch all answers for multiple submissions, joined with their question context.
   * Used by the data assembly pipeline to gather all answers in a single query.
   *
   * @param submissionIds - Array of submission UUIDs
   * @returns Array of answers with embedded question context
   */
  async getAnswersWithQuestions(
    submissionIds: readonly string[],
  ): Promise<AnswerWithQuestion[]> {
    if (submissionIds.length === 0) {
      return [];
    }

    const {data, error} = await supabase
      .from('evp_survey_answers')
      .select(
        'answer_json, answer_text, created_at, id, question_id, submission_id, updated_at, evp_survey_questions!question_id(key, prompt, question_type)',
      )
      .in('submission_id', submissionIds as string[]);

    if (error) {
      throw new Error(
        `Failed to fetch answers with questions: ${error.message}`,
      );
    }

    return (data || []).map(row => {
      const q = row.evp_survey_questions as unknown as {
        key: string;
        prompt: string;
        question_type: EvpQuestionType;
      } | null;

      if (!q) {
        throw new Error(`Missing question data for answer ${row.id}`);
      }

      return {
        answer_json: row.answer_json as Record<string, unknown> | null,
        answer_text: row.answer_text,
        created_at: row.created_at ?? '',
        id: row.id,
        question: {
          key: q.key,
          prompt: q.prompt,
          question_type: q.question_type,
        },
        question_id: row.question_id,
        submission_id: row.submission_id,
        updated_at: row.updated_at ?? '',
      };
    });
  }

  /**
   * Get all answered question IDs for a submission
   *
   * @param submissionId - Submission UUID
   * @returns Array of question IDs that have answers
   */
  async getAnsweredQuestionIds(submissionId: string): Promise<string[]> {
    const {data, error} = await supabase
      .from('evp_survey_answers')
      .select('question_id')
      .eq('submission_id', submissionId);

    if (error) {
      throw new Error(
        `Failed to fetch answered question IDs: ${error.message}`,
      );
    }

    return (data || []).map(row => row.question_id);
  }
}
