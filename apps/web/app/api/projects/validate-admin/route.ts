import {NextRequest, NextResponse} from 'next/server';

// eslint-disable-next-line import/extensions, import/no-unresolved
import {validateAdminToken} from '@/lib/validation';

/**
 * POST /api/projects/validate-admin
 *
 * Purpose:
 *   Validates admin token for a project to secure employer-facing routes.
 *
 * Input:
 *   JSON body:
 *     {
 *       "projectId": string; // UUID of the project
 *       "adminToken": string; // Admin authentication token
 *     }
 *
 * Successful response:
 *   200 OK
 *   Body:
 *     {
 *       "isValid": true;
 *       "project": {
 *         "id": string;
 *         "company_name": string;
 *         "status": string;
 *         // ... other project fields
 *       }
 *     }
 *
 * Possible error responses:
 *   400 Bad Request
 *     - Missing "projectId" or "adminToken" in request body.
 *
 *   401 Unauthorized
 *     - Invalid project or admin token does not match.
 *
 *   500 Internal Server Error
 *     - Unexpected error during validation.
 */
// eslint-disable-next-line import/prefer-default-export
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {adminToken, projectId} = body;

    if (!projectId || !adminToken) {
      return NextResponse.json(
        {error: 'Missing projectId or adminToken'},
        {status: 400},
      );
    }

    const result = await validateAdminToken(projectId, adminToken);

    if (!result.isValid) {
      return NextResponse.json(
        {error: result.error || 'Invalid credentials', isValid: false},
        {status: 401},
      );
    }

    return NextResponse.json(
      {isValid: true, project: result.project},
      {status: 200},
    );
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Validation endpoint error:', error);
    return NextResponse.json(
      {
        error: 'Failed to validate credentials',
        isValid: false,
      },
      {status: 500},
    );
  }
}
