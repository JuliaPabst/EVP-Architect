import {supabase} from '@/lib/supabase';
import {SurveySubmission, SurveyType} from '@/lib/types/survey';

/**
 * Repository for survey submissions table operations
 */
export class SurveySubmissionRepository {
  /**
   * Find an existing submission for a project and survey type
   *
   * @param projectId - Project UUID
   * @param surveyType - 'employer' or 'employee'
   * @returns Submission if found, null otherwise
   */
  async findSubmission(
    projectId: string,
    surveyType: SurveyType,
  ): Promise<SurveySubmission | null> {
    const {data, error} = await supabase
      .from('evp_survey_submissions')
      .select('*')
      .eq('project_id', projectId)
      .eq('survey_type', surveyType)
      .single();

    if (error) {
      // PGRST116 means no rows found, which is expected
      if (error.code === 'PGRST116') {
        return null;
      }

      throw new Error(`Failed to fetch submission: ${error.message}`);
    }

    return data;
  }

  /**
   * Create a new survey submission
   *
   * @param projectId - Project UUID
   * @param surveyType - 'employer' or 'employee'
   * @returns Created submission
   */
  async createSubmission(
    projectId: string,
    surveyType: SurveyType,
  ): Promise<SurveySubmission> {
    const {data, error} = await supabase
      .from('evp_survey_submissions')
      .insert({
        project_id: projectId,
        respondent_meta: {},
        status: 'in_progress',
        survey_type: surveyType,
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create submission: ${error.message}`);
    }

    return data;
  }

  /**
   * Get or create employer submission for a project
   * Ensures only one employer submission exists per project
   *
   * @param projectId - Project UUID
   * @returns Employer submission
   */
  async getOrCreateEmployerSubmission(
    projectId: string,
  ): Promise<SurveySubmission> {
    const existing = await this.findSubmission(projectId, 'employer');

    if (existing) {
      return existing;
    }

    return this.createSubmission(projectId, 'employer');
  }
}
