import {NextRequest, NextResponse} from 'next/server';

import {validateProjectAccess} from '@/lib/middleware/validateProjectAccess';
import {EmployerSurveyService} from '@/lib/services/employerSurveyService';

/**
 * GET /api/employer-survey/step/[step]
 *
 * Purpose:
 *   Retrieve employer survey questions for a specific step
 *   along with any existing answers.
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
 *         answer: { text?: string, values?: string[] } | null
 *       }]
 *     }
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
  try {
    // Validate project access
    const validation = await validateProjectAccess(request);

    if (!validation.success) {
      return validation.error!;
    }

    const project = validation.project!;

    // Parse and validate step
    const step = Number.parseInt(params.step, 10);

    if (Number.isNaN(step) || step < 1 || step > 5) {
      return NextResponse.json({error: 'invalid_step'}, {status: 400});
    }

    // Fetch step data
    const service = new EmployerSurveyService();
    const stepData = await service.getStepData(project.id, step);

    return NextResponse.json(stepData);
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Failed to get employer survey step:', error);

    return NextResponse.json(
      {
        error: 'internal_error',
        message: 'Failed to retrieve survey step',
      },
      {status: 500},
    );
  }
}
