/**
 * @jest-environment node
 */
import {NextRequest, NextResponse} from 'next/server';

import {POST} from './route';

import {
  validateProjectAccess,
  ProjectContext,
} from '@/lib/middleware/validateProjectAccess';
import EmployerSurveyService from '@/lib/services/employerSurveyService';

// Mock dependencies
jest.mock('@/lib/middleware/validateProjectAccess');
jest.mock('@/lib/services/employerSurveyService');

describe('POST /api/employer-survey/complete', () => {
  const mockValidateProjectAccess =
    validateProjectAccess as jest.MockedFunction<typeof validateProjectAccess>;
  const mockCompleteEmployerSurvey = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (
      EmployerSurveyService as jest.MockedClass<typeof EmployerSurveyService>
    ).mockImplementation(
      () =>
        ({
          completeEmployerSurvey: mockCompleteEmployerSurvey,
        }) as unknown as EmployerSurveyService,
    );
  });

  it('should complete survey successfully', async () => {
    mockValidateProjectAccess.mockResolvedValue({
      project: {
        id: 'project-123',
        status: 'employer_survey_in_progress',
      } as unknown as ProjectContext,
      success: true,
    });

    mockCompleteEmployerSurvey.mockResolvedValue(undefined);

    const request = new NextRequest(
      'http://localhost:3001/api/employer-survey/complete?projectId=project-123&admin_token=valid-token',
      {
        method: 'POST',
      },
    );

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toEqual({success: true});
    expect(mockCompleteEmployerSurvey).toHaveBeenCalledWith(
      'project-123',
      'employer_survey_in_progress',
    );
  });

  it('should return 401 when validateProjectAccess fails', async () => {
    const errorResponse = NextResponse.json(
      {error: 'unauthorized', message: 'Invalid or missing admin token'},
      {status: 401},
    );

    mockValidateProjectAccess.mockResolvedValue({
      error: errorResponse,
      success: false,
    });

    const request = new NextRequest(
      'http://localhost:3001/api/employer-survey/complete?projectId=project-123',
      {
        method: 'POST',
      },
    );

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error).toBe('unauthorized');
    expect(mockCompleteEmployerSurvey).not.toHaveBeenCalled();
  });

  it('should return 400 when no submission found', async () => {
    mockValidateProjectAccess.mockResolvedValue({
      project: {
        id: 'project-123',
        status: 'employer_survey_in_progress',
      } as unknown as ProjectContext,
      success: true,
    });

    const error = new Error('no_submission_found');

    mockCompleteEmployerSurvey.mockRejectedValue(error);

    const request = new NextRequest(
      'http://localhost:3001/api/employer-survey/complete?projectId=project-123&admin_token=valid-token',
      {
        method: 'POST',
      },
    );

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('no_submission_found');
  });

  it('should return 400 when survey already completed', async () => {
    mockValidateProjectAccess.mockResolvedValue({
      project: {
        id: 'project-123',
        status: 'employer_survey_in_progress',
      } as unknown as ProjectContext,
      success: true,
    });

    const error = new Error('already_completed');

    mockCompleteEmployerSurvey.mockRejectedValue(error);

    const request = new NextRequest(
      'http://localhost:3001/api/employer-survey/complete?projectId=project-123&admin_token=valid-token',
      {
        method: 'POST',
      },
    );

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('already_completed');
  });

  it('should return 400 when project state is invalid', async () => {
    mockValidateProjectAccess.mockResolvedValue({
      project: {
        id: 'project-123',
        status: 'completed',
      } as unknown as ProjectContext,
      success: true,
    });

    const error = new Error('invalid_project_state');

    mockCompleteEmployerSurvey.mockRejectedValue(error);

    const request = new NextRequest(
      'http://localhost:3001/api/employer-survey/complete?projectId=project-123&admin_token=valid-token',
      {
        method: 'POST',
      },
    );

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('invalid_project_state');
  });

  it('should return 400 when required questions are missing', async () => {
    mockValidateProjectAccess.mockResolvedValue({
      project: {
        id: 'project-123',
        status: 'employer_survey_in_progress',
      } as unknown as ProjectContext,
      success: true,
    });

    const error = new Error('missing_required_questions') as Error & {
      missing_question_ids?: string[];
    };

    error.missing_question_ids = ['q1', 'q2', 'q3'];
    mockCompleteEmployerSurvey.mockRejectedValue(error);

    const request = new NextRequest(
      'http://localhost:3001/api/employer-survey/complete?projectId=project-123&admin_token=valid-token',
      {
        method: 'POST',
      },
    );

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('missing_required_questions');
    expect(data.details.missing_question_ids).toEqual(['q1', 'q2', 'q3']);
  });

  it('should return 400 when required questions are missing without question IDs', async () => {
    mockValidateProjectAccess.mockResolvedValue({
      project: {
        id: 'project-123',
        status: 'employer_survey_in_progress',
      } as unknown as ProjectContext,
      success: true,
    });

    const error = new Error('missing_required_questions');

    mockCompleteEmployerSurvey.mockRejectedValue(error);

    const request = new NextRequest(
      'http://localhost:3001/api/employer-survey/complete?projectId=project-123&admin_token=valid-token',
      {
        method: 'POST',
      },
    );

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('missing_required_questions');
  });

  it('should return 500 for other service errors', async () => {
    mockValidateProjectAccess.mockResolvedValue({
      project: {
        id: 'project-123',
        status: 'employer_survey_in_progress',
      } as unknown as ProjectContext,
      success: true,
    });

    mockCompleteEmployerSurvey.mockRejectedValue(
      new Error('Database connection failed'),
    );

    const request = new NextRequest(
      'http://localhost:3001/api/employer-survey/complete?projectId=project-123&admin_token=valid-token',
      {
        method: 'POST',
      },
    );

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe('internal_error');
  });

  it('should handle non-Error exceptions', async () => {
    mockValidateProjectAccess.mockResolvedValue({
      project: {
        id: 'project-123',
        status: 'employer_survey_in_progress',
      } as unknown as ProjectContext,
      success: true,
    });

    mockCompleteEmployerSurvey.mockRejectedValue('String error');

    const request = new NextRequest(
      'http://localhost:3001/api/employer-survey/complete?projectId=project-123&admin_token=valid-token',
      {
        method: 'POST',
      },
    );

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe('internal_error');
  });

  it('should pass correct project status to service', async () => {
    mockValidateProjectAccess.mockResolvedValue({
      project: {
        id: 'project-456',
        status: 'custom_status',
      } as unknown as ProjectContext,
      success: true,
    });

    mockCompleteEmployerSurvey.mockResolvedValue(undefined);

    const request = new NextRequest(
      'http://localhost:3001/api/employer-survey/complete?projectId=project-456&admin_token=valid-token',
      {
        method: 'POST',
      },
    );

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toEqual({success: true});
    expect(mockCompleteEmployerSurvey).toHaveBeenCalledWith(
      'project-456',
      'custom_status',
    );
  });
});
