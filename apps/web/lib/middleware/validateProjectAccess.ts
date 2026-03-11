import {NextRequest, NextResponse} from 'next/server';

import {AuthError} from '@/lib/errors';
import {ProjectRepository} from '@/lib/repositories/projectRepository';

/**
 * Project context attached to validated requests
 */
export interface ProjectContext {
  readonly admin_token: string;
  readonly company_name: string;
  readonly created_at: string;
  readonly id: string;
  readonly profile_url: string;
  readonly status: string;
  readonly updated_at: string;
  readonly employee_count?: string;
  readonly industry?: number;
  readonly location?: string;
  readonly profile_image_url?: string;
  readonly profile_uuid?: string;
}

/**
 * Result of project access validation
 */
interface ValidationResult {
  readonly success: boolean;
  readonly error?: NextResponse;
  readonly project?: ProjectContext;
}

/**
 * Validates project access using projectId and admin_token.
 *
 * Purpose:
 *   Middleware for employer survey endpoints. Ensures that:
 *   1. projectId exists in query params
 *   2. admin_token exists in header or query
 *   3. Project exists in database
 *   4. admin_token matches the project's token
 *
 * Input:
 *   - request: NextRequest object
 *
 * Output:
 *   ValidationResult containing:
 *   - success: boolean
 *   - project: ProjectContext (if successful)
 *   - error: NextResponse with 401 status (if failed)
 *
 * Usage in route handlers:
 *   const validation = await validateProjectAccess(request);
 *   if (!validation.success) {
 *     return validation.error;
 *   }
 *   const project = validation.project;
 *
 * Authentication sources (in order of precedence):
 *   1. Query parameter: ?admin_token=xxx
 *   2. Header: Authorization: Bearer xxx
 *   3. Header: x-admin-token: xxx
 */
export async function validateProjectAccess(
  request: NextRequest,
): Promise<ValidationResult> {
  // Extract projectId from query params
  const {searchParams} = new URL(request.url);
  const projectId = searchParams.get('projectId');

  if (!projectId) {
    return {
      error: AuthError.missingProjectId(),
      success: false,
    };
  }

  // Extract admin_token from query or headers
  let adminToken = searchParams.get('admin_token');

  if (!adminToken) {
    // Try Authorization header (Bearer token)
    const authHeader = request.headers.get('authorization');

    if (authHeader?.startsWith('Bearer ')) {
      adminToken = authHeader.substring(7);
    }
  }

  if (!adminToken) {
    // Try x-admin-token header
    adminToken = request.headers.get('x-admin-token');
  }

  if (!adminToken) {
    return {
      error: AuthError.missingAdminToken(),
      success: false,
    };
  }

  // Fetch project and validate token via repository
  try {
    const projectRepository = new ProjectRepository();
    const project = await projectRepository.findByIdAndAdminToken(
      projectId,
      adminToken,
    );

    if (!project) {
      return {
        error: AuthError.invalidCredentials(),
        success: false,
      };
    }

    // Return project context
    return {
      project: {
        admin_token: project.admin_token,
        company_name: project.company_name,
        created_at: project.created_at,
        employee_count: project.employee_count ?? undefined,
        id: project.id,
        industry: project.industry ?? undefined,
        location: project.location ?? undefined,
        profile_image_url: project.profile_image_url ?? undefined,
        profile_url: project.profile_url,
        profile_uuid: project.profile_uuid ?? undefined,
        status: project.status,
        updated_at: project.updated_at,
      },
      success: true,
    };
  } catch (error) {
    console.error('Project access validation error:', error);

    return {
      error: AuthError.validationFailed('Failed to validate project access'),
      success: false,
    };
  }
}
