import {NextRequest, NextResponse} from 'next/server';

import {handleAssembleAnalyzeError} from '@/app/api/evp-pipeline/_shared/pipelineHandlers';
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
 *   Assembles employer survey data and performs analysis, then updates project status.
 *
 * Behaviour:
 *   - If project status is 'evp_generated': returns { ran: false } immediately
 *     (results are already up-to-date, skip re-assembly).
 *   - Otherwise: runs assemble + analyze, sets status to 'evp_generated',
 *     and returns { ran: true, analysis }.
 *
 * Input:
 *   - Query parameter: projectId (UUID)
 *   - Auth: admin_token (query param or header)
 *
 * Output:
 *   Success (200):
 *     { ran: false }                      — pipeline skipped, results already current
 *     { ran: true, analysis: AnalysisResult } — pipeline ran successfully
 *
 *   Errors:
 *     400 - assembly_not_found: Assembly step failed unexpectedly
 *     400 - analysis_validation_failed: AI response did not match schema
 *     401: Authentication failed
 *     500: Internal error
 */

export async function POST(request: NextRequest): Promise<NextResponse> {
  return handleApiError(async () => {
    const validation = await validateProjectAccess(request);

    if (!validation.success) {
      return validation.error!;
    }

    const {id: projectId, status} = validation.project!;

    // Skip re-assembly when results are already current
    if (status === 'evp_generated') {
      return NextResponse.json({ran: false});
    }

    const assemblyService = new DataAssemblyService();
    const analysisService = new AnalysisService();
    const projectRepository = new ProjectRepository();

    try {
      // Step 0: Assemble employer survey data
      await assemblyService.assemble(projectId);

      // Step 1: Analyze the assembled data
      const analysis = await analysisService.analyze(projectId);

      // Mark pipeline as complete
      await projectRepository.updateStatus(projectId, 'evp_generated');

      return NextResponse.json({analysis, ran: true});
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

      return handleAssembleAnalyzeError(error);
    }
  }, 'POST /api/evp-pipeline/trigger');
}
