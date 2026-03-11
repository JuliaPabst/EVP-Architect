import {NextRequest, NextResponse} from 'next/server';

import {BadRequestError, handleApiError} from '@/lib/errors';
import {validateProjectAccess} from '@/lib/middleware/validateProjectAccess';
import EmployerSurveyService from '@/lib/services/employerSurveyService';

/**
 * POST /api/employer-survey/complete
 *
 * Purpose:
 *   Complete the employer survey by validating all questions are answered
 *   and updating submission + project status.
 *
 * Input:
 *   - Query parameter: projectId (UUID)
 *   - Auth: admin_token (query param or header)
 *
 * Output:
 *   Success (200):
 *     { success: true }
 *
 *   Errors:
 *     400 - no_submission_found: No employer submission exists
 *     400 - already_completed: Submission already marked as submitted
 *     400 - invalid_project_state: Project not in employer_survey_in_progress state
 *     400 - missing_required_questions: { error, missing_question_ids }
 *     401: Authentication failed
 *     500: Internal error
 */
// eslint-disable-next-line import/prefer-default-export
export async function POST(request: NextRequest): Promise<NextResponse> {
  return handleApiError(async () => {
    // Validate project access
    const validation = await validateProjectAccess(request);

    if (!validation.success) {
      return validation.error!;
    }

    const project = validation.project!;

    // Complete survey
    const service = new EmployerSurveyService();

    try {
      await service.completeEmployerSurvey(project.id, project.status);

      return NextResponse.json({success: true});
    } catch (error) {
      const errorMessage = (error as Error).message;

      if (errorMessage === 'no_submission_found') {
        return BadRequestError.noSubmissionFound();
      }

      if (errorMessage === 'already_completed') {
        return BadRequestError.alreadyCompleted();
      }

      if (errorMessage === 'invalid_project_state') {
        return BadRequestError.invalidProjectState();
      }

      if (errorMessage === 'missing_required_questions') {
        const missingQuestionIds = (
          error as Error & {missing_question_ids?: string[]}
        ).missing_question_ids;

        return BadRequestError.missingRequiredQuestions(missingQuestionIds);
      }

      // Rethrow other errors
      throw error;
    }
  }, 'POST /api/employer-survey/complete');
}
