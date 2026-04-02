import {NextResponse} from 'next/server';

import {EvpOutputType} from '@/lib/types/pipeline';

export const VALID_OUTPUT_TYPES: EvpOutputType[] = [
  'external',
  'gap_analysis',
  'internal',
];

export function validateOutputType(
  outputType: string | null,
): NextResponse | null {
  if (
    !outputType ||
    !VALID_OUTPUT_TYPES.includes(outputType as EvpOutputType)
  ) {
    return NextResponse.json(
      {
        error: 'invalid_output_type',
        message: 'outputType must be one of: internal, external, gap_analysis',
      },
      {status: 400},
    );
  }
  return null;
}

export function handleOutputGenerationError(error: unknown): NextResponse {
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

export function handleAssembleAnalyzeError(error: unknown): NextResponse {
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
