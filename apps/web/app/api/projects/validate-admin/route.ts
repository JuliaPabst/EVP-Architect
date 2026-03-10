import {NextRequest, NextResponse} from 'next/server';

// eslint-disable-next-line import/extensions, import/no-unresolved
import {validateProjectAccess} from '@/lib/middleware/validateProjectAccess';

/**
 * GET /api/projects/validate-admin
 *
 * Purpose:
 *   Validates admin token for a project to secure employer-facing routes.
 *
 * Input:
 *   Query parameters:
 *     - projectId: UUID of the project
 *     - admin_token: Admin authentication token (or via headers)
 *
 *   Alternative: Authorization header (Bearer token) or x-admin-token header
 *
 * Successful response:
 *   200 OK
 *   Body:
 *     {
 *       "valid": true;
 *       "project": {
 *         "id": string;
 *         "company_name": string;
 *         "status": string;
 *         // ... other project fields
 *       }
 *     }
 *
 * Possible error responses:
 *   401 Unauthorized
 *     - Missing projectId or admin_token
 *     - Invalid project or admin token does not match
 */
// eslint-disable-next-line import/prefer-default-export
export async function GET(request: NextRequest) {
  // Validate project access using middleware
  const validation = await validateProjectAccess(request);

  if (!validation.success) {
    return validation.error;
  }

  // Return success with project data
  return NextResponse.json(
    {
      project: validation.project,
      valid: true,
    },
    {status: 200},
  );
}
