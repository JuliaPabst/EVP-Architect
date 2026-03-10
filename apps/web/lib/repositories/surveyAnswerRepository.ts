import {supabase} from '@/lib/supabase';
import {SurveyAnswer} from '@/lib/types/survey';

/**
 * Repository for survey answers table operations
 */
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
}
