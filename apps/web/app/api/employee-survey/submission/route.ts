import {NextRequest, NextResponse} from 'next/server';

import {BadRequestError, handleApiError} from '@/lib/errors';
import EmployeeSurveyService from '@/lib/services/employeeSurveyService';

/**
 * POST /api/employee-survey/submission
 *
 * Purpose:
 *   Get or create an employee survey submission for a project.
 *   No authentication required — projectId is the only identifier.
 *   Employees store their submission_id in localStorage to restore answers.
 *
 * Input:
 *   - Query parameter: projectId (UUID)
 *   - Query parameter: submission_id (UUID, optional — if provided, tries to resume existing submission)
 *
 * Output:
 *   Success (200): { submission_id: string }
 *
 *   Errors:
 *     400: Missing projectId
 *     500: Internal error
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  return handleApiError(async () => {
    const {searchParams} = new URL(request.url);
    const projectId = searchParams.get('projectId');

    if (!projectId) {
      return BadRequestError.missingField('projectId');
    }

    const submissionId = searchParams.get('submission_id');

    const service = new EmployeeSurveyService();
    const submission = await service.getOrCreateSubmission(
      submissionId,
      projectId,
    );

    return NextResponse.json({submission_id: submission.id});
  }, 'POST /api/employee-survey/submission');
}
