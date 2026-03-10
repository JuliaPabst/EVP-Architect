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
    readonly industry_name?: string;
    readonly location?: string;
    readonly profile_image_url?: string;
    readonly profile_uuid?: string;
  };
}

interface DatabaseProjectData {
  readonly company_name: string;
  readonly id: string;
  readonly profile_url: string;
  readonly status: string;
  readonly admin_token?: string;
  readonly employee_count?: string;
  readonly industry?: number | {name: string} | null;
  readonly location?: string;
  readonly profile_image_url?: string;
  readonly profile_uuid?: string;
  readonly survey_token?: string;
}

/**
 * Maps raw database data to project format.
 * Extracted to prevent duplication across validation functions.
 *
 * @param data - Raw data from Supabase query
 * @returns Formatted project object
 */
function mapProjectData(data: DatabaseProjectData) {
  return {
    company_name: data.company_name,
    employee_count: data.employee_count,
    id: data.id,
    industry: typeof data.industry === 'number' ? data.industry : undefined,
    industry_name: typeof data.industry === 'object' && data.industry?.name ? data.industry.name : undefined,
    location: data.location,
    profile_image_url: data.profile_image_url,
    profile_url: data.profile_url,
    profile_uuid: data.profile_uuid,
    status: data.status,
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
      .select('*, industry(name)')
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
      project: mapProjectData(data),
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
      .select('*, industry(name)')
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
      project: mapProjectData(data),
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
