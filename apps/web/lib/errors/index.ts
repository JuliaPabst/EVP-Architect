/**
 * Centralized API error handling utilities
 *
 * Usage:
 *   import { BadRequestError, AuthError, handleApiError } from '@/lib/errors';
 *
 * Examples:
 *   - return BadRequestError.invalidStep();
 *   - return AuthError.missingProjectId();
 *   - return InternalError.generic('Custom message');
 */
export {
  AuthError,
  BadRequestError,
  ErrorCode,
  handleApiError,
  HttpStatus,
  InternalError,
  UnprocessableError,
} from './apiErrors';

export type {ApiErrorResponse} from './apiErrors';
