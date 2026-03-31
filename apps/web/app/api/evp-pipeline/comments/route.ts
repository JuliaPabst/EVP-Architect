import {NextRequest, NextResponse} from 'next/server';

import {handleApiError} from '@/lib/errors';
import {validateProjectAccess} from '@/lib/middleware/validateProjectAccess';
import {EvpCommentRepository} from '@/lib/repositories/evpCommentRepository';
import {EvpOutputType} from '@/lib/types/pipeline';

/**
 * POST /api/evp-pipeline/comments
 *
 * Purpose:
 *   Save a reviewer comment for an EVP generation output type.
 *   Comments are accumulated and passed to Claude during regeneration.
 *
 * Input:
 *   - Query parameter: projectId (UUID)
 *   - Auth: admin_token (query param or header)
 *   - Request body (JSON):
 *     {
 *       "outputType": "internal" | "external" | "gap_analysis",
 *       "commentText": "string"
 *     }
 *
 * Output:
 *   Success (200):
 *     { id, project_id, output_type, comment_text, created_at }
 *
 *   Errors:
 *     400 - missing_fields: commentText or outputType missing
 *     400 - invalid_output_type: outputType is not one of the three valid types
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

    // Parse request body
    let body: Record<string, unknown>;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        {error: 'invalid_json', message: 'Request body must be valid JSON'},
        {status: 400},
      );
    }

    const {outputType, commentText} = body;

    // Validate required fields
    if (!outputType || !commentText) {
      return NextResponse.json(
        {
          error: 'missing_fields',
          message: 'Both outputType and commentText are required',
        },
        {status: 400},
      );
    }

    // Validate outputType
    const validOutputTypes: EvpOutputType[] = [
      'external',
      'gap_analysis',
      'internal',
    ];

    if (!validOutputTypes.includes(outputType as EvpOutputType)) {
      return NextResponse.json(
        {
          error: 'invalid_output_type',
          message:
            'outputType must be one of: internal, external, gap_analysis',
        },
        {status: 400},
      );
    }

    const repository = new EvpCommentRepository();

    const comment = await repository.save({
      comment_text: String(commentText),
      output_type: outputType as EvpOutputType,
      project_id: projectId,
    });

    return NextResponse.json(comment);
  }, 'POST /api/evp-pipeline/comments');
}
