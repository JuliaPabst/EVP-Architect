/**
 * @jest-environment node
 */
import {
  AuthError,
  BadRequestError,
  ErrorCode,
  handleApiError,
  HttpStatus,
  InternalError,
  UnprocessableError,
  ApiErrorResponse,
} from '.';

describe('errors/index exports', () => {
  describe('Error classes', () => {
    it('should export AuthError class', () => {
      expect(AuthError).toBeDefined();
      expect(typeof AuthError).toBe('object');
      expect(AuthError.missingProjectId).toBeDefined();
      expect(typeof AuthError.missingProjectId).toBe('function');
    });

    it('should export BadRequestError class', () => {
      expect(BadRequestError).toBeDefined();
      expect(typeof BadRequestError).toBe('object');
      expect(BadRequestError.invalidStep).toBeDefined();
      expect(typeof BadRequestError.invalidStep).toBe('function');
    });

    it('should export InternalError class', () => {
      expect(InternalError).toBeDefined();
      expect(typeof InternalError).toBe('object');
      expect(InternalError.generic).toBeDefined();
      expect(typeof InternalError.generic).toBe('function');
    });

    it('should export UnprocessableError class', () => {
      expect(UnprocessableError).toBeDefined();
      expect(typeof UnprocessableError).toBe('object');
      expect(UnprocessableError.invalidCompanyUrl).toBeDefined();
      expect(typeof UnprocessableError.invalidCompanyUrl).toBe('function');
    });
  });

  describe('Error helper function', () => {
    it('should export handleApiError function', () => {
      expect(handleApiError).toBeDefined();
      expect(typeof handleApiError).toBe('function');
    });
  });

  describe('Constants', () => {
    it('should export HttpStatus constants', () => {
      expect(HttpStatus).toBeDefined();
      expect(HttpStatus.BAD_REQUEST).toBe(400);
      expect(HttpStatus.UNAUTHORIZED).toBe(401);
      expect(HttpStatus.UNPROCESSABLE_ENTITY).toBe(422);
      expect(HttpStatus.INTERNAL_SERVER_ERROR).toBe(500);
    });

    it('should export ErrorCode constants', () => {
      expect(ErrorCode).toBeDefined();
      expect(ErrorCode.MISSING_PROJECT_ID).toBe('missing_project_id');
      expect(ErrorCode.MISSING_ADMIN_TOKEN).toBe('missing_admin_token');
      expect(ErrorCode.INVALID_CREDENTIALS).toBe('invalid_credentials');
      expect(ErrorCode.VALIDATION_FAILED).toBe('validation_failed');
      expect(ErrorCode.INVALID_STEP).toBe('invalid_step');
      expect(ErrorCode.ALREADY_COMPLETED).toBe('already_completed');
      expect(ErrorCode.MISSING_REQUIRED_QUESTIONS).toBe(
        'missing_required_questions',
      );
      expect(ErrorCode.INVALID_COMPANY_URL).toBe('invalid_company_url');
      expect(ErrorCode.SCRAPING_FAILED).toBe('scraping_failed');
      expect(ErrorCode.INTERNAL_ERROR).toBe('internal_error');
      expect(ErrorCode.DATABASE_ERROR).toBe('database_error');
    });
  });

  describe('Type exports', () => {
    it('should export ApiErrorResponse type', () => {
      // Type test - if this compiles, the type is exported correctly
      const errorResponse: ApiErrorResponse = {
        error: 'test_error',
        message: 'Test message',
      };

      expect(errorResponse).toBeDefined();
      expect(errorResponse.error).toBe('test_error');
      expect(errorResponse.message).toBe('Test message');
    });

    it('should handle ApiErrorResponse with details', () => {
      const errorResponse: ApiErrorResponse = {
        details: {key: 'value'},
        error: 'test_error',
        message: 'Test message',
      };

      expect(errorResponse.details).toEqual({key: 'value'});
    });
  });

  describe('Functional tests', () => {
    it('should create AuthError via exported functions', async () => {
      const response = AuthError.missingProjectId();
      const body = await response.json();

      expect(response.status).toBe(HttpStatus.UNAUTHORIZED);
      expect(body.error).toBe(ErrorCode.MISSING_PROJECT_ID);
    });

    it('should create BadRequestError via exported functions', async () => {
      const response = BadRequestError.invalidStep();
      const body = await response.json();

      expect(response.status).toBe(HttpStatus.BAD_REQUEST);
      expect(body.error).toBe(ErrorCode.INVALID_STEP);
    });

    it('should create UnprocessableError via exported functions', async () => {
      const response = UnprocessableError.invalidCompanyUrl();
      const body = await response.json();

      expect(response.status).toBe(HttpStatus.UNPROCESSABLE_ENTITY);
      expect(body.error).toBe(ErrorCode.INVALID_COMPANY_URL);
    });

    it('should create InternalError via exported functions', async () => {
      const response = InternalError.generic();
      const body = await response.json();

      expect(response.status).toBe(HttpStatus.INTERNAL_SERVER_ERROR);
      expect(body.error).toBe(ErrorCode.INTERNAL_ERROR);
    });
  });
});
