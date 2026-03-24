import {NextResponse} from 'next/server';

import {BadRequestError} from '@/lib/errors';

/**
 * Validate step parameter and return parsed number, or null if invalid
 */
export function validateStep(stepParam: string): number | null {
  const step = Number.parseInt(stepParam, 10);

  if (Number.isNaN(step) || step < 1 || step > 5) {
    return null;
  }

  return step;
}

/**
 * Map service error messages to appropriate HTTP error responses.
 * Returns null if the error should be re-thrown.
 */
export function handleServiceError(error: unknown): NextResponse | null {
  const errorMessage = error instanceof Error ? error.message : 'Unknown error';

  if (errorMessage.includes('does not belong to step')) {
    return BadRequestError.invalidQuestionForStep();
  }

  if (
    errorMessage.includes('Question not found') ||
    errorMessage.includes('not an employee question') ||
    errorMessage.includes('not an employer question')
  ) {
    return BadRequestError.validationFailed();
  }

  if (
    errorMessage.includes('required') ||
    errorMessage.includes('must be empty') ||
    errorMessage.includes('Too many values')
  ) {
    return BadRequestError.validationFailed();
  }

  return null;
}
