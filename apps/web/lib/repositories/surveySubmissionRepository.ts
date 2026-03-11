import {supabase} from '@/lib/supabase';
import {SurveySubmission, SurveyType} from '@/lib/types/survey';

/**
 * Repository for survey submissions table operations
 */
// eslint-disable-next-line import/prefer-default-export
export class SurveySubmissionRepository {
  /**
   * Find an existing submission for a project and survey type
   *
   * @param projectId - Project UUID
   * @param surveyType - 'employer' or 'employee'
   * @returns Submission if found, null otherwise
   */
  // eslint-disable-next-line class-methods-use-this
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
  // eslint-disable-next-line class-methods-use-this
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

  /**
   * Update submission status to submitted
   *
   * @param submissionId - Submission UUID
   * @throws Error if update fails
   */
  // eslint-disable-next-line class-methods-use-this
  async markAsSubmitted(submissionId: string): Promise<void> {
    const {error} = await supabase
      .from('evp_survey_submissions')
      .update({
        status: 'submitted',
        submitted_at: new Date().toISOString(),
      })
      .eq('id', submissionId);

    if (error) {
      throw new Error(
        `Failed to mark submission as submitted: ${error.message}`,
      );
    }
  }
}
