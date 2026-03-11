/**
 * @jest-environment node
 */
import {NextResponse} from 'next/server';

import {
  AuthError,
  BadRequestError,
  ErrorCode,
  handleApiError,
  HttpStatus,
  InternalError,
  UnprocessableError,
} from './apiErrors';

describe('apiErrors', () => {
  describe('AuthError', () => {
    it('should create missingProjectId error', async () => {
      const response = AuthError.missingProjectId();
      const body = await response.json();

      expect(response.status).toBe(HttpStatus.UNAUTHORIZED);
      expect(body.error).toBe(ErrorCode.MISSING_PROJECT_ID);
      expect(body.message).toBe('projectId query parameter is required');
    });

    it('should create missingAdminToken error', async () => {
      const response = AuthError.missingAdminToken();
      const body = await response.json();

      expect(response.status).toBe(HttpStatus.UNAUTHORIZED);
      expect(body.error).toBe(ErrorCode.MISSING_ADMIN_TOKEN);
      expect(body.message).toBe(
        'admin_token is required (query param or header)',
      );
    });

    it('should create invalidCredentials error', async () => {
      const response = AuthError.invalidCredentials();
      const body = await response.json();

      expect(response.status).toBe(HttpStatus.UNAUTHORIZED);
      expect(body.error).toBe(ErrorCode.INVALID_CREDENTIALS);
      expect(body.message).toBe('Invalid projectId or admin_token');
    });

    it('should create validationFailed error with custom message', async () => {
      const customMessage = 'Custom validation error';
      const response = AuthError.validationFailed(customMessage);
      const body = await response.json();

      expect(response.status).toBe(HttpStatus.UNAUTHORIZED);
      expect(body.error).toBe(ErrorCode.VALIDATION_FAILED);
      expect(body.message).toBe(customMessage);
    });
  });

  describe('BadRequestError', () => {
    it('should create invalidStep error', async () => {
      const response = BadRequestError.invalidStep();
      const body = await response.json();

      expect(response.status).toBe(HttpStatus.BAD_REQUEST);
      expect(body.error).toBe(ErrorCode.INVALID_STEP);
      expect(body.message).toBe('Invalid step number');
    });

    it('should create alreadyCompleted error', async () => {
      const response = BadRequestError.alreadyCompleted();
      const body = await response.json();

      expect(response.status).toBe(HttpStatus.BAD_REQUEST);
      expect(body.error).toBe(ErrorCode.ALREADY_COMPLETED);
      expect(body.message).toBe('Survey has already been completed');
    });

    it('should create missingRequiredQuestions error with question IDs', async () => {
      const questionIds = ['q1', 'q2', 'q3'];
      const response = BadRequestError.missingRequiredQuestions(questionIds);
      const body = await response.json();

      expect(response.status).toBe(HttpStatus.BAD_REQUEST);
      expect(body.error).toBe(ErrorCode.MISSING_REQUIRED_QUESTIONS);
      expect(body.details).toEqual({missing_question_ids: questionIds});
    });

    it('should create validationFailed error', async () => {
      const response = BadRequestError.validationFailed();
      const body = await response.json();

      expect(response.status).toBe(HttpStatus.BAD_REQUEST);
      expect(body.error).toBe(ErrorCode.VALIDATION_FAILED);
    });
  });

  describe('UnprocessableError', () => {
    it('should create invalidCompanyUrl error', async () => {
      const response = UnprocessableError.invalidCompanyUrl();
      const body = await response.json();

      expect(response.status).toBe(HttpStatus.UNPROCESSABLE_ENTITY);
      expect(body.error).toBe(ErrorCode.INVALID_COMPANY_URL);
      expect(body.message).toBe('Invalid kununu company profile URL');
    });

    it('should create scrapingFailed error with details', async () => {
      const details = 'Network timeout';
      const response = UnprocessableError.scrapingFailed(details);
      const body = await response.json();

      expect(response.status).toBe(HttpStatus.UNPROCESSABLE_ENTITY);
      expect(body.error).toBe(ErrorCode.SCRAPING_FAILED);
      expect(body.details).toEqual({details});
    });

    it('should create scrapingFailed error without details', async () => {
      const response = UnprocessableError.scrapingFailed();
      const body = await response.json();

      expect(response.status).toBe(HttpStatus.UNPROCESSABLE_ENTITY);
      expect(body.error).toBe(ErrorCode.SCRAPING_FAILED);
      expect(body.details).toBeUndefined();
    });
  });

  describe('InternalError', () => {
    it('should create generic internal error', async () => {
      const response = InternalError.generic();
      const body = await response.json();

      expect(response.status).toBe(HttpStatus.INTERNAL_SERVER_ERROR);
      expect(body.error).toBe(ErrorCode.INTERNAL_ERROR);
      expect(body.message).toBe('An unexpected error occurred');
    });

    it('should create generic internal error with custom message', async () => {
      const customMessage = 'Something went wrong';
      const response = InternalError.generic(customMessage);
      const body = await response.json();

      expect(response.status).toBe(HttpStatus.INTERNAL_SERVER_ERROR);
      expect(body.error).toBe(ErrorCode.INTERNAL_ERROR);
      expect(body.message).toBe(customMessage);
    });

    it('should create databaseError with operation', async () => {
      const operation = 'fetch user data';
      const response = InternalError.databaseError(operation);
      const body = await response.json();

      expect(response.status).toBe(HttpStatus.INTERNAL_SERVER_ERROR);
      expect(body.error).toBe(ErrorCode.DATABASE_ERROR);
      expect(body.details).toEqual({operation});
    });
  });

  describe('handleApiError', () => {
    it('should return successful response on success', async () => {
      const mockResponse = NextResponse.json({data: 'test'});
      const handler = jest.fn().mockResolvedValue(mockResponse);

      const response = await handleApiError(handler, 'Test context');

      expect(response).toBe(mockResponse);
      expect(handler).toHaveBeenCalledTimes(1);
    });

    it('should return internal error on exception', async () => {
      const handler = jest.fn().mockRejectedValue(new Error('Test error'));

      // Mock console.error to avoid cluttering test output
      const consoleErrorSpy = jest
        .spyOn(console, 'error')
        .mockImplementation(() => {});

      const response = await handleApiError(handler, 'Test context');
      const body = await response.json();

      expect(response.status).toBe(HttpStatus.INTERNAL_SERVER_ERROR);
      expect(body.error).toBe(ErrorCode.INTERNAL_ERROR);
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        '[Test context] Error:',
        expect.any(Error),
      );

      consoleErrorSpy.mockRestore();
    });

    it('should handle non-Error exceptions', async () => {
      const handler = jest.fn().mockRejectedValue('String error');

      // Mock console.error
      const consoleErrorSpy = jest
        .spyOn(console, 'error')
        .mockImplementation(() => {});

      const response = await handleApiError(handler, 'Test context');
      const body = await response.json();

      expect(response.status).toBe(HttpStatus.INTERNAL_SERVER_ERROR);
      expect(body.error).toBe(ErrorCode.INTERNAL_ERROR);

      consoleErrorSpy.mockRestore();
    });
  });
});
