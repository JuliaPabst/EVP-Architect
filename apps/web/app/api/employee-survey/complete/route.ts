import {NextRequest, NextResponse} from 'next/server';

import {BadRequestError, handleApiError} from '@/lib/errors';
import {SurveySubmissionRepository} from '@/lib/repositories/surveySubmissionRepository';
import DataAssemblyService from '@/lib/services/dataAssemblyService';

/**
 * POST /api/employee-survey/complete
 *
 * Purpose:
 *   Mark an employee survey submission as submitted and update the EVP
 *   assembly JSON so it reflects the latest submitted responses.
 *
 * Input:
 *   - Query parameter: submission_id (UUID) — required
 *   - Query parameter: project_id (UUID) — optional; when provided, triggers
 *     data re-assembly so the evp_ai_results snapshot stays current
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
    const projectId = searchParams.get('project_id');

    if (!submissionId) {
      return BadRequestError.missingField('submission_id');
    }

    const repository = new SurveySubmissionRepository();

    await repository.markAsSubmitted(submissionId);

    if (projectId) {
      try {
        const assemblyService = new DataAssemblyService();

        await assemblyService.assemble(projectId);
      } catch (error) {
        console.error('Data assembly after employee submit failed:', error);
      }
    }

    return NextResponse.json({success: true});
  }, 'POST /api/employee-survey/complete');
}
