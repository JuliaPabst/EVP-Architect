/**
 * USAGE EXAMPLE
 *
 * This demonstrates how to use the validateProjectAccess middleware
 * in API route handlers for the employer survey endpoints.
 *
 * DO NOT include this file in production builds.
 */

import {NextRequest, NextResponse} from 'next/server';

import {validateProjectAccess} from './validateProjectAccess';

/**
 * Example: GET /api/employer-survey/step/[step]
 *
 * Query params:
 *   - projectId: UUID
 *   - admin_token: string (or in Authorization header)
 *   - step: 1-5
 */
export async function exampleGETRoute(request: NextRequest) {
  // Step 1: Validate project access
  const validation = await validateProjectAccess(request);

  if (!validation.success) {
    return validation.error;
  }

  // Step 2: Access the validated project
  const {project} = validation;

  // Step 3: Continue with business logic
  return NextResponse.json({
    message: 'Success',
    projectId: project!.id,
    status: project!.status,
  });
}

/**
 * Example: POST /api/employer-survey/step/[step]
 *
 * Headers or query params:
 *   - Authorization: Bearer <token>
 *   OR
 *   - x-admin-token: <token>
 *   OR
 *   - ?admin_token=<token>
 *
 * Query params:
 *   - projectId: UUID
 */
export async function examplePOSTRoute(request: NextRequest) {
  // Step 1: Validate project access
  const validation = await validateProjectAccess(request);

  if (!validation.success) {
    // Returns 401 with error details
    return validation.error;
  }

  const {project} = validation;

  // Step 2: Parse request body
  const body = await request.json();

  // Step 3: Your business logic here
  // - Validate input
  // - Call service layer
  // - Return response

  return NextResponse.json({
    message: 'Survey step saved',
    projectId: project!.id,
    ...body,
  });
}

/**
 * Supported authentication methods (in order of precedence):
 *
 * 1. Query parameter:
 *    GET /api/route?projectId=xxx&admin_token=yyy
 *
 * 2. Authorization Bearer header:
 *    Authorization: Bearer <admin_token>
 *
 * 3. Custom header:
 *    x-admin-token: <admin_token>
 */
