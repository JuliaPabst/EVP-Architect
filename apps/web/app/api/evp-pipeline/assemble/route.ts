import {NextRequest, NextResponse} from 'next/server';

import {BadRequestError, handleApiError} from '@/lib/errors';
import {validateProjectAccess} from '@/lib/middleware/validateProjectAccess';
import DataAssemblyService from '@/lib/services/dataAssemblyService';

/**
 * POST /api/evp-pipeline/assemble
 *
 * Purpose:
 *   Assemble all submitted survey data for a project into a structured payload
 *   for the AI pipeline. Saves the result to evp_ai_results with pipeline_step = 'assembly'.
 *
 * Input:
 *   - Query parameter: projectId (UUID)
 *   - Auth: admin_token (query param or header)
 *
 * Output:
 *   Success (200):
 *     { payload: AssemblyPayload }
 *
 *   Errors:
 *     400 - insufficient_submissions: Fewer than 3 submitted employee surveys
 *     400 - project_not_found: No project found for the given projectId
 *     401: Authentication failed
 *     500: Internal error
 */

export async function POST(request: NextRequest): Promise<NextResponse> {
  return handleApiError(async () => {
    const validation = await validateProjectAccess(request);

    if (!validation.success) {
      return validation.error!;
    }

    const {id: projectId} = validation.project!;
    const service = new DataAssemblyService();

    try {
      const payload = await service.assemble(projectId);

      return NextResponse.json({payload});
    } catch (error) {
      const {message} = error as Error;

      if (message === 'project_not_found') {
        return BadRequestError.missingField('projectId');
      }

      if (message === 'insufficient_submissions') {
        return NextResponse.json(
          {
            error: 'insufficient_submissions',
            message: `At least 3 submitted employee surveys are required to run the pipeline`,
          },
          {status: 400},
        );
      }

      throw error;
    }
  }, 'POST /api/evp-pipeline/assemble');
}
