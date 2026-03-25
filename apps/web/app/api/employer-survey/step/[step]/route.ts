import {NextRequest, NextResponse} from 'next/server';

import {BadRequestError, handleApiError} from '@/lib/errors';
import {validateProjectAccess} from '@/lib/middleware/validateProjectAccess';
import EmployerSurveyService from '@/lib/services/employerSurveyService';
import {handleServiceError, validateStep} from '@/lib/utils/apiStepUtils';
import {saveStepAnswersSchema} from '@/lib/validation/surveySchemas';

/**
 * Validate project access and step parameter
 * Returns validated project and step, or error response
 */
async function validateStepRequest(
  request: NextRequest,
  stepParam: string,
): Promise<
  | {projectId: string; step: number; success: true}
  | {error: NextResponse; success: false}
> {
  const validation = await validateProjectAccess(request);

  if (!validation.success) {
    return {error: validation.error!, success: false};
  }

  const step = validateStep(stepParam);

  if (step === null) {
    return {error: BadRequestError.invalidStep(), success: false};
  }

  return {projectId: validation.project!.id, step, success: true};
}

/**
 * GET /api/employer-survey/step/[step]
 *
 * Purpose:
 *   Retrieve employer survey questions for a specific step
 *   along with any existing answers and selectable options.
 *
 * Input:
 *   - Path parameter: step (1-5)
 *   - Query parameter: projectId (UUID)
 *   - Auth: admin_token (query param or header)
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
 *   Notes:
 *     - options field only present for single_select and multi_select questions
 *     - single_select options loaded from evp_question_options (filtered by question_key)
 *     - multi_select options loaded from evp_value_options (all value chips)
 *     - Options ordered deterministically (by position for single_select, by key for multi_select)
 *
 *   Errors:
 *     400: Invalid step
 *     401: Authentication failed
 *     500: Internal error
 */
export async function GET(
  request: NextRequest,
  {params}: {readonly params: {readonly step: string}},
): Promise<NextResponse> {
  return handleApiError(async () => {
    const validation = await validateStepRequest(request, params.step);

    if (!validation.success) {
      return validation.error;
    }

    const {projectId, step} = validation;

    const service = new EmployerSurveyService();
    const stepData = await service.getStepData(projectId, step);

    return NextResponse.json(stepData);
  }, 'GET /api/employer-survey/step/[step]');
}

/**
 * POST /api/employer-survey/step/[step]
 *
 * Purpose:
 *   Save employer survey answers for a specific step.
 *   Supports Save + Continue behavior.
 *   Does NOT modify submission.status.
 *
 * Input:
 *   - Path parameter: step (1-5)
 *   - Query parameter: projectId (UUID)
 *   - Auth: admin_token (query param or header)
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
 *     400: Invalid step, validation failed, or invalid_question_for_step
 *     401: Authentication failed
 *     500: Internal error
 */
export async function POST(
  request: NextRequest,
  {params}: {readonly params: {readonly step: string}},
): Promise<NextResponse> {
  return handleApiError(async () => {
    const validation = await validateStepRequest(request, params.step);

    if (!validation.success) {
      return validation.error;
    }

    const {projectId, step} = validation;

    const body = await request.json();
    const parseResult = saveStepAnswersSchema.safeParse(body);

    if (!parseResult.success) {
      return BadRequestError.validationFailed();
    }

    const {answers} = parseResult.data;

    const service = new EmployerSurveyService();

    try {
      await service.saveStepAnswers(projectId, step, answers);
    } catch (error) {
      const errorResponse = handleServiceError(error);

      if (errorResponse) {
        return errorResponse;
      }

      throw error;
    }

    return NextResponse.json({success: true});
  }, 'POST /api/employer-survey/step/[step]');
}
