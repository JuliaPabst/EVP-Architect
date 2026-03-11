import {NextRequest, NextResponse} from 'next/server';

import {BadRequestError, handleApiError} from '@/lib/errors';
import {validateProjectAccess} from '@/lib/middleware/validateProjectAccess';
import EmployerSurveyService from '@/lib/services/employerSurveyService';
import {saveStepAnswersSchema} from '@/lib/validation/employerSurveySchemas';

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
    // Validate project access
    const validation = await validateProjectAccess(request);

    if (!validation.success) {
      return validation.error!;
    }

    const project = validation.project!;

    // Parse and validate step
    const step = Number.parseInt(params.step, 10);

    if (Number.isNaN(step) || step < 1 || step > 5) {
      return BadRequestError.invalidStep();
    }

    // Fetch step data
    const service = new EmployerSurveyService();
    const stepData = await service.getStepData(project.id, step);

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
    // Validate project access
    const validation = await validateProjectAccess(request);

    if (!validation.success) {
      return validation.error!;
    }

    const project = validation.project!;

    // Parse and validate step
    const step = Number.parseInt(params.step, 10);

    if (Number.isNaN(step) || step < 1 || step > 5) {
      return BadRequestError.invalidStep();
    }

    // Parse and validate request body
    const body = await request.json();
    const parseResult = saveStepAnswersSchema.safeParse(body);

    if (!parseResult.success) {
      return BadRequestError.validationFailed();
    }

    const {answers} = parseResult.data;

    // Save answers
    const service = new EmployerSurveyService();

    try {
      await service.saveStepAnswers(project.id, step, answers);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';

      if (errorMessage.includes('does not belong to step')) {
        return BadRequestError.invalidQuestionForStep();
      }

      if (
        errorMessage.includes('required') ||
        errorMessage.includes('must be empty') ||
        errorMessage.includes('Too many values')
      ) {
        return BadRequestError.validationFailed();
      }

      throw error;
    }

    return NextResponse.json({success: true});
  }, 'POST /api/employer-survey/step/[step]');
}
