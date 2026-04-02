import {NextRequest, NextResponse} from 'next/server';

import {handleApiError} from '@/lib/errors';
import {validateProjectAccess} from '@/lib/middleware/validateProjectAccess';
import AnalysisService from '@/lib/services/analysisService';

/**
 * POST /api/evp-pipeline/analyze
 *
 * Purpose:
 *   Run Step 1 of the EVP AI pipeline (Analysis & Synthesis).
 *   Loads the latest assembly payload for a project, sends it to gpt-4o-mini,
 *   validates the structured JSON response, and saves it to evp_ai_results
 *   with pipeline_step = 'analysis'.
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
 *     400 - assembly_not_found: No assembly result exists for this project (run /assemble first)
 *     400 - analysis_validation_failed: OpenAI response did not match the expected schema after retry
 *     401: Authentication failed
 *     500: Internal error (OpenAI API error, network timeout, etc.)
 */

export async function POST(request: NextRequest): Promise<NextResponse> {
  return handleApiError(async () => {
    const validation = await validateProjectAccess(request);

    if (!validation.success) {
      return validation.error!;
    }

    const {id: projectId} = validation.project!;
    const service = new AnalysisService();

    try {
      const analysis = await service.analyze(projectId);

      return NextResponse.json({analysis});
    } catch (error) {
      const {message} = error as Error;

      if (message === 'assembly_not_found') {
        return NextResponse.json(
          {
            error: 'assembly_not_found',
            message:
              'No assembly result found for this project. Run /api/evp-pipeline/assemble first.',
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
  }, 'POST /api/evp-pipeline/analyze');
}
