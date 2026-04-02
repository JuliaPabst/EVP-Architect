import {NextRequest, NextResponse} from 'next/server';

import {handleApiError} from '@/lib/errors';
import {validateProjectAccess} from '@/lib/middleware/validateProjectAccess';
import {EvpCommentRepository} from '@/lib/repositories/evpCommentRepository';
import AnalysisService from '@/lib/services/analysisService';
import DataAssemblyService from '@/lib/services/dataAssemblyService';
import EvpOutputService from '@/lib/services/evpOutputService';
import {EvpOutputType} from '@/lib/types/pipeline';

/**
 * POST /api/evp-pipeline/regenerate
 *
 * Purpose:
 *   Regenerate EVP pipeline results. Supports two scopes:
 *   - "full": Re-run Steps 0 & 1 (assemble & analyze)
 *   - "output": Re-run Step 2 (generate) for a specific output type
 *
 * Input:
 *   - Query parameter: projectId (UUID)
 *   - Query parameter: scope - 'full' or 'output'
 *   - Query parameter: outputType (required when scope='output') - 'internal', 'external', or 'gap_analysis'
 *   - Query parameter: targetAudience (optional, only for scope='output')
 *   - Auth: admin_token (query param or header)
 *   - Request body (optional, JSON):
 *     {
 *       "commentText": "optional reviewer feedback to save and incorporate"
 *     }
 *
 * Output:
 *   Success (200):
 *     If scope='full': { analysis: AnalysisResult }
 *     If scope='output': { text: string }
 *
 *   Errors:
 *     400 - invalid_scope: scope is not 'full' or 'output'
 *     400 - invalid_output_type: outputType is not valid (only when scope='output')
 *     400 - insufficient_submissions: Fewer than 3 submitted employee surveys
 *     400 - analysis_validation_failed: Analysis schema validation failed
 *     400 - assembly_not_found: No assembly result exists
 *     400 - analysis_not_found: No analysis result exists (only when scope='output')
 *     401: Authentication failed
 *     500: Internal error
 */

async function handleFullScope(projectId: string): Promise<NextResponse> {
  const assemblyService = new DataAssemblyService();
  const analysisService = new AnalysisService();

  try {
    await assemblyService.assemble(projectId);
    const analysis = await analysisService.analyze(projectId);

    return NextResponse.json({analysis});
  } catch (error) {
    const {message} = error as Error;

    if (message === 'insufficient_submissions') {
      return NextResponse.json(
        {
          error: 'insufficient_submissions',
          message: `At least 3 submitted employee surveys are required to run the pipeline`,
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

    throw error;
  }
}

async function handleOutputScope(
  projectId: string,
  searchParams: URLSearchParams,
  request: NextRequest,
): Promise<NextResponse> {
  const outputType = searchParams.get('outputType');
  const targetAudience = searchParams.get('targetAudience') ?? undefined;
  const toneOfVoice = searchParams.get('toneOfVoice') ?? undefined;
  const language = searchParams.get('language') ?? undefined;

  const validOutputTypes: EvpOutputType[] = [
    'external',
    'gap_analysis',
    'internal',
  ];

  if (!outputType || !validOutputTypes.includes(outputType as EvpOutputType)) {
    return NextResponse.json(
      {
        error: 'invalid_output_type',
        message: 'outputType must be one of: internal, external, gap_analysis',
      },
      {status: 400},
    );
  }

  const body = await request.json().catch(() => ({}));
  const rawComment = (body as Record<string, unknown>).commentText;
  const commentText = typeof rawComment === 'string' ? rawComment : undefined;

  const commentRepository = new EvpCommentRepository();
  const existingComments =
    await commentRepository.findAllByProjectAndOutputType(
      projectId,
      outputType as EvpOutputType,
    );

  const commentTexts = [
    ...existingComments.map(c => c.comment_text),
    ...(commentText ? [commentText] : []),
  ];

  const service = new EvpOutputService();

  try {
    const text = await service.generate(
      projectId,
      outputType as EvpOutputType,
      targetAudience,
      commentTexts,
      toneOfVoice,
      language,
    );

    // Persist comment only after successful generation
    if (commentText) {
      await commentRepository.save({
        comment_text: commentText,
        output_type: outputType as EvpOutputType,
        project_id: projectId,
      });
    }

    return NextResponse.json({text});
  } catch (error) {
    const {message} = error as Error;

    if (message === 'analysis_not_found') {
      return NextResponse.json(
        {
          error: 'analysis_not_found',
          message:
            'No analysis result found for this project. Run /api/evp-pipeline/analyze first.',
        },
        {status: 400},
      );
    }

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

    if (message === 'claude_content_filtered') {
      return NextResponse.json(
        {
          error: 'generation_failed',
          message:
            'The generated output exceeded the token limit. Please try again or contact support.',
        },
        {status: 500},
      );
    }

    throw error;
  }
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  return handleApiError(async () => {
    const validation = await validateProjectAccess(request);

    if (!validation.success) {
      return validation.error!;
    }

    const {id: projectId} = validation.project!;
    const {searchParams} = new URL(request.url);
    const scope = searchParams.get('scope');

    if (!scope || !['full', 'output'].includes(scope)) {
      return NextResponse.json(
        {
          error: 'invalid_scope',
          message: 'scope must be either "full" or "output"',
        },
        {status: 400},
      );
    }

    if (scope === 'full') {
      return handleFullScope(projectId);
    }

    return handleOutputScope(projectId, searchParams, request);
  }, 'POST /api/evp-pipeline/regenerate');
}
