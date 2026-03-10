import {supabase} from '@/lib/supabase';
import {SurveyQuestion, SurveyType} from '@/lib/types/survey';

/**
 * Repository for survey questions table operations
 */
export class SurveyQuestionRepository {
  /**
   * Fetch questions for a specific survey type and step
   *
   * @param surveyType - 'employer' or 'employee'
   * @param step - Step number (1-5)
   * @returns Array of questions ordered by position
   */
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
}
