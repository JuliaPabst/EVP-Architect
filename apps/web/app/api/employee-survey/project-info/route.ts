import {NextRequest, NextResponse} from 'next/server';

import {BadRequestError, handleApiError} from '@/lib/errors';
import {ProjectRepository} from '@/lib/repositories/projectRepository';

/**
 * GET /api/employee-survey/project-info
 *
 * Purpose:
 *   Returns public project information for the employee survey landing.
 *   No authentication required — only projectId needed.
 *
 * Input:
 *   - Query parameter: projectId (UUID)
 *
 * Output:
 *   Success (200):
 *     {
 *       company_name: string,
 *       location: string | null,
 *       profile_image_url: string | null
 *     }
 *
 *   Errors:
 *     400: Missing or invalid projectId
 *     500: Internal error
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  return handleApiError(async () => {
    const {searchParams} = new URL(request.url);
    const projectId = searchParams.get('projectId');

    if (!projectId) {
      return BadRequestError.missingField('projectId');
    }

    const projectRepository = new ProjectRepository();
    const project = await projectRepository.findById(projectId);

    if (!project) {
      return BadRequestError.missingField('projectId');
    }

    return NextResponse.json({
      company_name: project.company_name,
      location: project.location,
      profile_image_url: project.profile_image_url,
    });
  }, 'GET /api/employee-survey/project-info');
}
