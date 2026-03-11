import {NextRequest, NextResponse} from 'next/server';

import {validateProjectAccess} from '@/lib/middleware/validateProjectAccess';
import {EmployerSurveyService} from '@/lib/services/employerSurveyService';

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
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
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
        return NextResponse.json(
          {error: 'no_submission_found'},
          {status: 400},
        );
      }

      if (errorMessage === 'already_completed') {
        return NextResponse.json({error: 'already_completed'}, {status: 400});
      }

      if (errorMessage === 'invalid_project_state') {
        return NextResponse.json(
          {error: 'invalid_project_state'},
          {status: 400},
        );
      }

      if (errorMessage === 'missing_required_questions') {
        const missingQuestionIds = (
          error as Error & {missing_question_ids?: string[]}
        ).missing_question_ids;

        return NextResponse.json(
          {
            error: 'missing_required_questions',
            missing_question_ids: missingQuestionIds || [],
          },
          {status: 400},
        );
      }

      // Rethrow other errors
      throw error;
    }
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Failed to complete employer survey:', error);

    return NextResponse.json(
      {
        error: 'internal_error',
        message: 'Failed to complete survey',
      },
      {status: 500},
    );
  }
}
