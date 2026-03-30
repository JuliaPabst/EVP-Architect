import {NextRequest, NextResponse} from 'next/server';

import {handleApiError} from '@/lib/errors';
import {validateProjectAccess} from '@/lib/middleware/validateProjectAccess';
import {ProjectRepository} from '@/lib/repositories/projectRepository';
import AnalysisService from '@/lib/services/analysisService';
import DataAssemblyService from '@/lib/services/dataAssemblyService';

/**
 * POST /api/evp-pipeline/trigger
 *
 * Purpose:
 *   Orchestrate the complete EVP AI pipeline (Steps 0 & 1).
 *   Assembles survey data and performs analysis, then updates project status.
 *
 * Prerequisites:
 *   - Project status must be 'evp_generation_available'
 *   - At least 3 submitted employee surveys
 *
 * Input:
 *   - Query parameter: projectId (UUID)
 *   - Auth: admin_token (query param or header)
 *
 * Output:
 *   Success (200):
 *     { analysis: AnalysisResult }
 *
 *   Errors:
 *     400 - project_not_in_correct_state: Project status is not evp_generation_available
 *     400 - insufficient_submissions: Fewer than 3 submitted employee surveys
 *     400 - assembly_not_found: Assembly step failed unexpectedly
 *     400 - analysis_validation_failed: OpenAI response did not match schema
 *     401: Authentication failed
 *     500: Internal error
 */

export async function POST(request: NextRequest): Promise<NextResponse> {
  return handleApiError(async () => {
    const validation = await validateProjectAccess(request);

    if (!validation.success) {
      return validation.error!;
    }

    const {id: projectId, status: projectStatus} = validation.project!;

    // Verify project is in correct state
    if (projectStatus !== 'evp_generation_available') {
      return NextResponse.json(
        {
          error: 'project_not_in_correct_state',
          message:
            'Project status must be "evp_generation_available" to trigger the pipeline',
        },
        {status: 400},
      );
    }

    const assemblyService = new DataAssemblyService();
    const analysisService = new AnalysisService();
    const projectRepository = new ProjectRepository();

    try {
      // Step 0: Assemble survey data
      await assemblyService.assemble(projectId);

      // Step 1: Analyze the assembled data
      const analysis = await analysisService.analyze(projectId);

      // Update project status on success
      await projectRepository.updateStatus(projectId, 'evp_generated');

      return NextResponse.json({analysis});
    } catch (error) {
      const {message} = error as Error;

      if (message === 'project_not_found') {
        return NextResponse.json(
          {
            error: 'project_not_found',
            message: 'Project not found',
          },
          {status: 400},
        );
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

      if (message === 'assembly_not_found') {
        return NextResponse.json(
          {
            error: 'assembly_not_found',
            message:
              'No assembly result found. This should not happen. Please try again.',
          },
          {status: 400},
        );
      }

      if (message === 'analysis_validation_failed') {
        return NextResponse.json(
          {
            error: 'analysis_validation_failed',
            message:
              'The AI response did not match the expected schema after retry. Please try again.',
          },
          {status: 400},
        );
      }

      throw error;
    }
  }, 'POST /api/evp-pipeline/trigger');
}
