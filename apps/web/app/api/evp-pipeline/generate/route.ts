import {NextRequest, NextResponse} from 'next/server';

import {
  handleOutputGenerationError,
  validateOutputType,
} from '@/app/api/evp-pipeline/_shared/pipelineHandlers';
import {handleApiError} from '@/lib/errors';
import {validateProjectAccess} from '@/lib/middleware/validateProjectAccess';
import EvpOutputService from '@/lib/services/evpOutputService';
import {EvpOutputType} from '@/lib/types/pipeline';

/**
 * POST /api/evp-pipeline/generate
 *
 * Purpose:
 *   Run Step 2 of the EVP AI pipeline (EVP Output Generation).
 *   Loads the stored Step 1 analysis result, generates EVP copy using Claude Sonnet,
 *   and saves the result to evp_ai_results with pipeline_step = 'internal' | 'external' | 'gap_analysis'.
 *
 * Input:
 *   - Query parameter: projectId (UUID)
 *   - Query parameter: outputType ('internal' | 'external' | 'gap_analysis')
 *   - Query parameter: targetAudience (optional, for external EVP only)
 *   - Auth: admin_token (query param or header)
 *
 * Output:
 *   Success (200):
 *     { text: string }
 *
 *   Errors:
 *     400 - analysis_not_found: No analysis result exists for this project (run /analyze first)
 *     400 - assembly_not_found: No assembly result exists for this project (run /assemble first)
 *     400 - invalid_output_type: outputType is not one of the three valid types
 *     401: Authentication failed
 *     500: Internal error (Claude API error, network timeout, etc.)
 */

export async function POST(request: NextRequest): Promise<NextResponse> {
  return handleApiError(async () => {
    const validation = await validateProjectAccess(request);

    if (!validation.success) {
      return validation.error!;
    }

    const {id: projectId} = validation.project!;
    const {searchParams} = new URL(request.url);

    const outputType = searchParams.get('outputType');
    const targetAudience = searchParams.get('targetAudience') ?? undefined;
    const toneOfVoice = searchParams.get('toneOfVoice') ?? undefined;
    const language = searchParams.get('language') ?? undefined;

    const outputTypeError = validateOutputType(outputType);

    if (outputTypeError) return outputTypeError;

    const service = new EvpOutputService();

    try {
      const text = await service.generate(
        projectId,
        outputType as EvpOutputType,
        targetAudience,
        undefined,
        toneOfVoice,
        language,
      );

      return NextResponse.json({text});
    } catch (error) {
      return handleOutputGenerationError(error);
    }
  }, 'POST /api/evp-pipeline/generate');
}
