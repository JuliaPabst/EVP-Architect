import {supabase} from '@/lib/supabase';
import {SurveyQuestion, SurveyType} from '@/lib/types/survey';

/**
 * Repository for survey questions table operations
 */
// eslint-disable-next-line import/prefer-default-export
export class SurveyQuestionRepository {
  /**
   * Fetch questions for a specific survey type and step
   *
   * @param surveyType - 'employer' or 'employee'
   * @param step - Step number (1-5)
   * @returns Array of questions ordered by position
   */
  // eslint-disable-next-line class-methods-use-this
  async getQuestionsByStep(
    surveyType: SurveyType,
    step: number,
  ): Promise<SurveyQuestion[]> {
    const {data, error} = await supabase
      .from('evp_survey_questions')
      .select('*')
      .eq('survey_type', surveyType)
      .eq('step', step)
      .order('position', {ascending: true});

    if (error) {
      throw new Error(`Failed to fetch survey questions: ${error.message}`);
    }

    return data || [];
  }

  /**
   * Fetch questions by IDs
   *
   * @param questionIds - Array of question UUIDs
   * @returns Map of question_id -> question
   */
  // eslint-disable-next-line class-methods-use-this
  async getQuestionsByIds(
    questionIds: readonly string[],
  ): Promise<Map<string, SurveyQuestion>> {
    if (questionIds.length === 0) {
      return new Map();
    }

    const {data, error} = await supabase
      .from('evp_survey_questions')
      .select('*')
      .in('id', questionIds as string[]);

    if (error) {
      throw new Error(`Failed to fetch questions by IDs: ${error.message}`);
    }

    const questionMap = new Map<string, SurveyQuestion>();

    for (const question of data || []) {
      questionMap.set(question.id, question);
    }

    return questionMap;
  }

  /**
   * Get all question IDs for a specific survey type
   *
   * @param surveyType - 'employer' or 'employee'
   * @returns Array of question IDs
   */
  // eslint-disable-next-line class-methods-use-this
  async getAllQuestionIds(surveyType: SurveyType): Promise<string[]> {
    const {data, error} = await supabase
      .from('evp_survey_questions')
      .select('id')
      .eq('survey_type', surveyType);

    if (error) {
      throw new Error(
        `Failed to fetch question IDs for ${surveyType}: ${error.message}`,
      );
    }

    return (data || []).map(row => row.id);
  }
}
