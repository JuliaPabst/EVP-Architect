import {supabase} from '@/lib/supabase';

export type ProjectStatus =
  | 'employer_survey_in_progress'
  | 'employer_survey_completed'
  | 'employee_survey_active'
  | 'evp_generation_available'
  | 'evp_generated';

export interface Project {
  readonly id: string;
  readonly created_at: string;
  readonly updated_at: string;
  readonly profile_url: string;
  readonly company_name: string;
  readonly industry: number | null;
  readonly employee_count: string | null;
  readonly location: string | null;
  readonly profile_image_url: string | null;
  readonly profile_uuid: string | null;
  readonly admin_token: string;
  readonly survey_token: string;
  readonly status: ProjectStatus;
  readonly admin_token_created_at: string;
  readonly survey_token_created_at: string;
}

/**
 * Repository for project table operations
 */
export class ProjectRepository {
  /**
   * Update project status
   *
   * @param projectId - Project UUID
   * @param status - New project status
   * @throws Error if update fails
   */
  async updateStatus(projectId: string, status: ProjectStatus): Promise<void> {
    const {error} = await supabase
      .from('evp_projects')
      .update({
        status,
        updated_at: new Date().toISOString(),
      })
      .eq('id', projectId);

    if (error) {
      throw new Error(`Failed to update project status: ${error.message}`);
    }
  }

  /**
   * Get project by ID
   *
   * @param projectId - Project UUID
   * @returns Project if found, null otherwise
   */
  async getById(projectId: string): Promise<Project | null> {
    const {data, error} = await supabase
      .from('evp_projects')
      .select('*')
      .eq('id', projectId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null;
      }

      throw new Error(`Failed to fetch project: ${error.message}`);
    }

    return data;
  }
}
