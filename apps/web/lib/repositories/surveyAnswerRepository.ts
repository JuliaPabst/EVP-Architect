import {supabase} from '@/lib/supabase';
import {SurveyAnswer} from '@/lib/types/survey';

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
