import {NextRequest, NextResponse} from 'next/server';

import {BadRequestError, handleApiError} from '@/lib/errors';
import {SurveySubmissionRepository} from '@/lib/repositories/surveySubmissionRepository';

/**
 * POST /api/employee-survey/complete
 *
 * Purpose:
 *   Mark an employee survey submission as submitted.
 *
 * Input:
 *   - Query parameter: submission_id (UUID)
 *
 * Output:
 *   Success (200):
 *     { success: true }
 *
 *   Errors:
 *     400 - missing_field: submission_id is missing
 *     500: Internal error
 */
// eslint-disable-next-line import/prefer-default-export
export async function POST(request: NextRequest): Promise<NextResponse> {
  return handleApiError(async () => {
    const {searchParams} = new URL(request.url);
    const submissionId = searchParams.get('submission_id');

    if (!submissionId) {
      return BadRequestError.missingField('submission_id');
    }

    const repository = new SurveySubmissionRepository();

    await repository.markAsSubmitted(submissionId);

    return NextResponse.json({success: true});
  }, 'POST /api/employee-survey/complete');
}
