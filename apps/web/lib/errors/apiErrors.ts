import {NextResponse} from 'next/server';

/**
 * Standard API error response structure
 */
export interface ApiErrorResponse {
  readonly error: string;
  readonly message: string;
  readonly details?: Record<string, unknown>;
}

/**
 * HTTP status codes for API errors
 */
export const HttpStatus = {
  BAD_REQUEST: 400,
  INTERNAL_SERVER_ERROR: 500,
  UNAUTHORIZED: 401,
  UNPROCESSABLE_ENTITY: 422,
} as const;

/**
 * Standard error codes used across the API
 */
export const ErrorCode = {
  // Bad request errors (400)
  ALREADY_COMPLETED: 'already_completed',
  // Internal errors (500)
  DATABASE_ERROR: 'database_error',
  INTERNAL_ERROR: 'internal_error',
  // Unprocessable entity errors (422)
  INVALID_COMPANY_URL: 'invalid_company_url',
  // Authentication errors (401)
  INVALID_CREDENTIALS: 'invalid_credentials',
  // Bad request errors (400)
  INVALID_PROJECT_STATE: 'invalid_project_state',
  INVALID_QUESTION_FOR_STEP: 'invalid_question_for_step',
  INVALID_STEP: 'invalid_step',
  MISSING_ADMIN_TOKEN: 'missing_admin_token',
  MISSING_COMPANY_URL: 'missing_company_url',
  MISSING_PROJECT_ID: 'missing_project_id',
  MISSING_REQUIRED_QUESTIONS: 'missing_required_questions',
  NO_SUBMISSION_FOUND: 'no_submission_found',
  // Unprocessable entity errors (422)
  SCRAPING_FAILED: 'scraping_failed',
  // Authentication errors (401)
  VALIDATION_FAILED: 'validation_failed',
} as const;

/**
 * Error messages for each error code
 */
const ErrorMessages: Record<string, string> = {
  [ErrorCode.ALREADY_COMPLETED]: 'Survey has already been completed',
  [ErrorCode.DATABASE_ERROR]: 'Database operation failed',
  [ErrorCode.INTERNAL_ERROR]: 'An unexpected error occurred',
  [ErrorCode.INVALID_COMPANY_URL]: 'Invalid kununu company profile URL',
  [ErrorCode.INVALID_CREDENTIALS]: 'Invalid projectId or admin_token',
  [ErrorCode.INVALID_PROJECT_STATE]:
    'Project is not in the correct state for this operation',
  [ErrorCode.INVALID_QUESTION_FOR_STEP]:
    'One or more questions do not belong to this step',
  [ErrorCode.INVALID_STEP]: 'Invalid step number',
  [ErrorCode.MISSING_ADMIN_TOKEN]:
    'admin_token is required (query param or header)',
  [ErrorCode.MISSING_COMPANY_URL]: 'Company URL is required',
  [ErrorCode.MISSING_PROJECT_ID]: 'projectId query parameter is required',
  [ErrorCode.MISSING_REQUIRED_QUESTIONS]:
    'Required questions have not been answered',
  [ErrorCode.NO_SUBMISSION_FOUND]: 'No employer survey submission found',
  [ErrorCode.SCRAPING_FAILED]:
    'Could not extract required company information from profile',
  [ErrorCode.VALIDATION_FAILED]: 'Request validation failed',
};

/**
 * Configuration for creating an API error response
 */
interface ErrorConfig {
  readonly code: string;
  readonly status: number;
  readonly details?: Record<string, unknown>;
  readonly message?: string;
}

/**
 * Creates a standardized NextResponse error object
 */
function createErrorResponse(config: ErrorConfig): NextResponse {
  const response: ApiErrorResponse = config.details
    ? {
        details: config.details,
        error: config.code,
        message: config.message || ErrorMessages[config.code] || config.code,
      }
    : {
        error: config.code,
        message: config.message || ErrorMessages[config.code] || config.code,
      };

  return NextResponse.json(response, {status: config.status});
}

/**
 * Authentication error responses (401)
 */
export const AuthError = {
  invalidCredentials: (): NextResponse =>
    createErrorResponse({
      code: ErrorCode.INVALID_CREDENTIALS,
      status: HttpStatus.UNAUTHORIZED,
    }),

  missingAdminToken: (): NextResponse =>
    createErrorResponse({
      code: ErrorCode.MISSING_ADMIN_TOKEN,
      status: HttpStatus.UNAUTHORIZED,
    }),

  missingProjectId: (): NextResponse =>
    createErrorResponse({
      code: ErrorCode.MISSING_PROJECT_ID,
      status: HttpStatus.UNAUTHORIZED,
    }),

  validationFailed: (message?: string): NextResponse =>
    createErrorResponse({
      code: ErrorCode.VALIDATION_FAILED,
      message,
      status: HttpStatus.UNAUTHORIZED,
    }),
};

/**
 * Bad request error responses (400)
 */
export const BadRequestError = {
  alreadyCompleted: (): NextResponse =>
    createErrorResponse({
      code: ErrorCode.ALREADY_COMPLETED,
      status: HttpStatus.BAD_REQUEST,
    }),

  invalidProjectState: (): NextResponse =>
    createErrorResponse({
      code: ErrorCode.INVALID_PROJECT_STATE,
      status: HttpStatus.BAD_REQUEST,
    }),

  invalidQuestionForStep: (): NextResponse =>
    createErrorResponse({
      code: ErrorCode.INVALID_QUESTION_FOR_STEP,
      status: HttpStatus.BAD_REQUEST,
    }),

  invalidStep: (): NextResponse =>
    createErrorResponse({
      code: ErrorCode.INVALID_STEP,
      status: HttpStatus.BAD_REQUEST,
    }),

  missingCompanyUrl: (): NextResponse =>
    createErrorResponse({
      code: ErrorCode.MISSING_COMPANY_URL,
      status: HttpStatus.BAD_REQUEST,
    }),

  missingRequiredQuestions: (missingQuestionIds?: string[]): NextResponse =>
    createErrorResponse({
      code: ErrorCode.MISSING_REQUIRED_QUESTIONS,
      details: {missing_question_ids: missingQuestionIds || []},
      status: HttpStatus.BAD_REQUEST,
    }),

  noSubmissionFound: (): NextResponse =>
    createErrorResponse({
      code: ErrorCode.NO_SUBMISSION_FOUND,
      status: HttpStatus.BAD_REQUEST,
    }),

  validationFailed: (message?: string): NextResponse =>
    createErrorResponse({
      code: ErrorCode.VALIDATION_FAILED,
      message,
      status: HttpStatus.BAD_REQUEST,
    }),
};

/**
 * Unprocessable entity error responses (422)
 */
export const UnprocessableError = {
  invalidCompanyUrl: (): NextResponse =>
    createErrorResponse({
      code: ErrorCode.INVALID_COMPANY_URL,
      status: HttpStatus.UNPROCESSABLE_ENTITY,
    }),

  scrapingFailed: (details?: string): NextResponse =>
    createErrorResponse({
      code: ErrorCode.SCRAPING_FAILED,
      details: details ? {details} : undefined,
      status: HttpStatus.UNPROCESSABLE_ENTITY,
    }),
};

/**
 * Internal server error responses (500)
 */
export const InternalError = {
  databaseError: (operation?: string): NextResponse =>
    createErrorResponse({
      code: ErrorCode.DATABASE_ERROR,
      details: operation ? {operation} : undefined,
      status: HttpStatus.INTERNAL_SERVER_ERROR,
    }),

  generic: (message?: string): NextResponse =>
    createErrorResponse({
      code: ErrorCode.INTERNAL_ERROR,
      message,
      status: HttpStatus.INTERNAL_SERVER_ERROR,
    }),
};

/**
 * Type-safe error handler for API routes
 *
 * Usage:
 *   export async function GET(request: NextRequest) {
 *     return handleApiError(async () => {
 *       // Your route logic here
 *       return NextResponse.json({ data: ... });
 *     }, 'GET /api/example');
 *   }
 */
export async function handleApiError(
  handler: () => Promise<NextResponse>,
  context: string,
): Promise<NextResponse> {
  try {
    return await handler();
  } catch (error) {
    console.error(`[${context}] Error:`, error);

    return InternalError.generic();
  }
}
