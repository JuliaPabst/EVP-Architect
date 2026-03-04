// eslint-disable-next-line import/extensions, import/no-unresolved
import {supabase} from './supabase';

interface ValidationResult {
  readonly isValid: boolean;
  readonly error?: string;
  readonly project?: {
    readonly company_name: string;
    readonly id: string;
    readonly profile_url: string;
    readonly status: string;
    readonly employee_count?: string;
    readonly industry?: number;
    readonly location?: string;
    readonly profile_image_url?: string;
    readonly profile_uuid?: string;
  };
}

/**
 * Validates that a projectId exists and the provided adminToken matches.
 *
 * Purpose:
 *   Used to secure employer-facing routes by verifying both project existence
 *   and admin token correctness. If validation fails, the route should redirect
 *   to /evp-architect.
 *
 * @param projectId - The UUID of the project
 * @param adminToken - The admin token from query parameters
 * @returns ValidationResult with isValid flag and optional project data or error
 */
export async function validateAdminToken(
  projectId: string,
  adminToken: string | null | undefined,
): Promise<ValidationResult> {
  if (!adminToken) {
    return {
      error: 'Missing admin token',
      isValid: false,
    };
  }

  try {
    const {data, error} = await supabase
      .from('evp_projects')
      .select('*')
      .eq('id', projectId)
      .eq('admin_token', adminToken)
      .single();

    if (error || !data) {
      return {
        error: 'Invalid project or admin token',
        isValid: false,
      };
    }

    return {
      isValid: true,
      project: {
        company_name: data.company_name,
        employee_count: data.employee_count,
        id: data.id,
        industry: data.industry,
        location: data.location,
        profile_image_url: data.profile_image_url,
        profile_url: data.profile_url,
        profile_uuid: data.profile_uuid,
        status: data.status,
      },
    };
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Token validation error:', error);
    return {
      error: 'Validation failed',
      isValid: false,
    };
  }
}

/**
 * Validates that a surveyToken is valid and returns associated project data.
 *
 * Purpose:
 *   Used to secure employee-facing survey routes by verifying the survey token.
 *   If validation fails, the route should redirect to /evp-architect.
 *
 * @param surveyToken - The survey token from the URL
 * @returns ValidationResult with isValid flag and optional project data or error
 */
export async function validateSurveyToken(
  surveyToken: string,
): Promise<ValidationResult> {
  if (!surveyToken) {
    return {
      error: 'Missing survey token',
      isValid: false,
    };
  }

  try {
    const {data, error} = await supabase
      .from('evp_projects')
      .select('*')
      .eq('survey_token', surveyToken)
      .single();

    if (error || !data) {
      return {
        error: 'Invalid survey token',
        isValid: false,
      };
    }

    return {
      isValid: true,
      project: {
        company_name: data.company_name,
        employee_count: data.employee_count,
        id: data.id,
        industry: data.industry,
        location: data.location,
        profile_image_url: data.profile_image_url,
        profile_url: data.profile_url,
        profile_uuid: data.profile_uuid,
        status: data.status,
      },
    };
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Survey token validation error:', error);
    return {
      error: 'Validation failed',
      isValid: false,
    };
  }
}
