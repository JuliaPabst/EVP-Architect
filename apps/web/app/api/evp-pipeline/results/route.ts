import {NextRequest, NextResponse} from 'next/server';

import {handleApiError} from '@/lib/errors';
import {validateProjectAccess} from '@/lib/middleware/validateProjectAccess';
import {AiResultRepository} from '@/lib/repositories/aiResultRepository';
import {EvpPipelineStep} from '@/lib/types/database';

/**
 * GET /api/evp-pipeline/results
 *
 * Purpose:
 *   Fetch stored AI pipeline results for a project.
 *   Optionally filter by pipeline step.
 *
 * Input:
 *   - Query parameter: projectId (UUID)
 *   - Query parameter: pipeline_step (optional) - one of: assembly, analysis, internal, external, gap_analysis
 *   - Auth: admin_token (query param or header)
 *
 * Output:
 *   Success (200):
 *     { results: EvpAiResult[] } - ordered by generated_at descending
 *
 *   Errors:
 *     400 - invalid_pipeline_step: pipeline_step is not a valid step
 *     401: Authentication failed
 *     500: Internal error
 */

const VALID_PIPELINE_STEPS: readonly EvpPipelineStep[] = [
  'assembly',
  'analysis',
  'internal',
  'external',
  'gap_analysis',
];

export async function GET(request: NextRequest): Promise<NextResponse> {
  return handleApiError(async () => {
    const validation = await validateProjectAccess(request);

    if (!validation.success) {
      return validation.error!;
    }

    const {id: projectId} = validation.project!;
    const {searchParams} = new URL(request.url);
    const pipelineStep = searchParams.get('pipeline_step') ?? undefined;

    // Validate pipeline_step if provided
    if (
      pipelineStep &&
      !VALID_PIPELINE_STEPS.includes(pipelineStep as EvpPipelineStep)
    ) {
      return NextResponse.json(
        {
          error: 'invalid_pipeline_step',
          message:
            'pipeline_step must be one of: assembly, analysis, internal, external, gap_analysis',
        },
        {status: 400},
      );
    }

    const repository = new AiResultRepository();

    const results = await repository.findAllByProject(
      projectId,
      pipelineStep as EvpPipelineStep | undefined,
    );

    return NextResponse.json({results});
  }, 'GET /api/evp-pipeline/results');
}
