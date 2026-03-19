import {NextRequest, NextResponse} from 'next/server';

import {BadRequestError, handleApiError} from '@/lib/errors';
import EmployeeSurveyService from '@/lib/services/employeeSurveyService';
import {saveStepAnswersSchema} from '@/lib/validation/employeeSurveySchemas';

/**
 * Validate step parameter and return parsed number
 */
function validateStep(stepParam: string): number | null {
  const step = Number.parseInt(stepParam, 10);

  if (Number.isNaN(step) || step < 1 || step > 5) {
    return null;
  }

  return step;
}

/**
 * Extract and validate projectId and submission_id from request
 */
function extractRequestParams(request: NextRequest): {
  projectId: string | null;
  submissionId: string | null;
} {
  const {searchParams} = new URL(request.url);

  return {
    projectId: searchParams.get('projectId'),
    submissionId: searchParams.get('submission_id'),
  };
}

/**
 * GET /api/employee-survey/step/[step]
 *
 * Purpose:
 *   Retrieve employee survey questions for a specific step
 *   along with any existing answers and selectable options.
 *
 * Input:
 *   - Path parameter: step (1-5)
 *   - Query parameter: projectId (UUID)
 *   - Query parameter: submission_id (UUID)
 *
 * Output:
 *   Success (200):
 *     {
 *       step: number,
 *       questions: [{
 *         id: string,
 *         key: string,
 *         prompt: string,
 *         question_type: string,
 *         selection_limit: number | null,
 *         options?: [{ value_key: string, label: string }],
 *         answer: { text?: string, values?: string[] } | null
 *       }]
 *     }
 *
 *   Errors:
 *     400: Invalid step or missing params
 *     500: Internal error
 */
export async function GET(
  request: NextRequest,
  {params}: {readonly params: {readonly step: string}},
): Promise<NextResponse> {
  return handleApiError(async () => {
    const step = validateStep(params.step);

    if (step === null) {
      return BadRequestError.invalidStep();
    }

    const {submissionId} = extractRequestParams(request);

    if (!submissionId) {
      return BadRequestError.missingField('submission_id');
    }

    const service = new EmployeeSurveyService();
    const stepData = await service.getStepData(submissionId, step);

    return NextResponse.json(stepData);
  }, 'GET /api/employee-survey/step/[step]');
}

/**
 * Handle service errors and convert to appropriate HTTP responses
 */
function handleServiceError(error: unknown): NextResponse | null {
  const errorMessage = error instanceof Error ? error.message : 'Unknown error';

  if (errorMessage.includes('does not belong to step')) {
    return BadRequestError.invalidQuestionForStep();
  }

  if (
    errorMessage.includes('Question not found') ||
    errorMessage.includes('not an employee question')
  ) {
    return BadRequestError.validationFailed();
  }

  if (
    errorMessage.includes('required') ||
    errorMessage.includes('must be empty') ||
    errorMessage.includes('Too many values')
  ) {
    return BadRequestError.validationFailed();
  }

  return null;
}

/**
 * POST /api/employee-survey/step/[step]
 *
 * Purpose:
 *   Save employee survey answers for a specific step.
 *
 * Input:
 *   - Path parameter: step (1-5)
 *   - Query parameter: projectId (UUID)
 *   - Query parameter: submission_id (UUID)
 *   - Body: {
 *       answers: [{
 *         question_id: string,
 *         answer_text?: string,
 *         selected_values?: string[]
 *       }]
 *     }
 *
 * Output:
 *   Success (200): { success: true }
 *
 *   Errors:
 *     400: Invalid step, validation failed
 *     500: Internal error
 */
export async function POST(
  request: NextRequest,
  {params}: {readonly params: {readonly step: string}},
): Promise<NextResponse> {
  return handleApiError(async () => {
    const step = validateStep(params.step);

    if (step === null) {
      return BadRequestError.invalidStep();
    }

    const {submissionId} = extractRequestParams(request);

    if (!submissionId) {
      return BadRequestError.missingField('submission_id');
    }

    const body = await request.json();
    const parseResult = saveStepAnswersSchema.safeParse(body);

    if (!parseResult.success) {
      return BadRequestError.validationFailed();
    }

    const {answers} = parseResult.data;

    const service = new EmployeeSurveyService();

    try {
      await service.saveStepAnswers(submissionId, step, answers);
    } catch (error) {
      const errorResponse = handleServiceError(error);

      if (errorResponse) {
        return errorResponse;
      }

      throw error;
    }

    return NextResponse.json({success: true});
  }, 'POST /api/employee-survey/step/[step]');
}
