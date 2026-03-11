/**
 * @jest-environment node
 */
import {NextRequest, NextResponse} from 'next/server';

import {GET, POST} from './route';

import {
  validateProjectAccess,
  ProjectContext,
} from '@/lib/middleware/validateProjectAccess';
import EmployerSurveyService from '@/lib/services/employerSurveyService';

// Mock dependencies
jest.mock('@/lib/middleware/validateProjectAccess');
jest.mock('@/lib/services/employerSurveyService');

describe('GET /api/employer-survey/step/[step]', () => {
  const mockValidateProjectAccess =
    validateProjectAccess as jest.MockedFunction<typeof validateProjectAccess>;
  const mockGetStepData = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (
      EmployerSurveyService as jest.MockedClass<typeof EmployerSurveyService>
    ).mockImplementation(
      () =>
        ({
          getStepData: mockGetStepData,
        }) as unknown as EmployerSurveyService,
    );
  });

  it('should return step data successfully for valid request', async () => {
    const mockStepData = {
      questions: [
        {
          answer: null,
          id: 'q1',
          key: 'test_question',
          prompt: 'Test question?',
          question_type: 'free_text',
          selection_limit: null,
        },
      ],
      step: 2,
    };

    mockValidateProjectAccess.mockResolvedValue({
      project: {
        admin_token: 'valid-token',
        company_name: 'Test Company',
        id: 'project-123',
        status: 'employer_survey_in_progress',
      } as unknown as ProjectContext,
      success: true,
    });

    mockGetStepData.mockResolvedValue(mockStepData);

    const request = new NextRequest(
      'http://localhost:3001/api/employer-survey/step/2?projectId=project-123&admin_token=valid-token',
    );
    const response = await GET(request, {params: {step: '2'}});
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toEqual(mockStepData);
    expect(mockGetStepData).toHaveBeenCalledWith('project-123', 2);
  });

  it('should return 400 for invalid step (not a number)', async () => {
    mockValidateProjectAccess.mockResolvedValue({
      project: {
        id: 'project-123',
      } as unknown as ProjectContext,
      success: true,
    });

    const request = new NextRequest(
      'http://localhost:3001/api/employer-survey/step/invalid?projectId=project-123&admin_token=valid-token',
    );
    const response = await GET(request, {params: {step: 'invalid'}});
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('invalid_step');
    expect(mockGetStepData).not.toHaveBeenCalled();
  });

  it('should return 400 for step below 1', async () => {
    mockValidateProjectAccess.mockResolvedValue({
      project: {
        id: 'project-123',
      } as unknown as ProjectContext,
      success: true,
    });

    const request = new NextRequest(
      'http://localhost:3001/api/employer-survey/step/0?projectId=project-123&admin_token=valid-token',
    );
    const response = await GET(request, {params: {step: '0'}});
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('invalid_step');
    expect(mockGetStepData).not.toHaveBeenCalled();
  });

  it('should return 400 for step above 5', async () => {
    mockValidateProjectAccess.mockResolvedValue({
      project: {
        id: 'project-123',
      } as unknown as ProjectContext,
      success: true,
    });

    const request = new NextRequest(
      'http://localhost:3001/api/employer-survey/step/6?projectId=project-123&admin_token=valid-token',
    );
    const response = await GET(request, {params: {step: '6'}});
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('invalid_step');
    expect(mockGetStepData).not.toHaveBeenCalled();
  });

  it('should return 401 when validateProjectAccess fails', async () => {
    const errorResponse = NextResponse.json(
      {error: 'unauthorized'},
      {status: 401},
    );

    mockValidateProjectAccess.mockResolvedValue({
      error: errorResponse,
      success: false,
    });

    const request = new NextRequest(
      'http://localhost:3001/api/employer-survey/step/2?projectId=project-123',
    );
    const response = await GET(request, {params: {step: '2'}});
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error).toBe('unauthorized');
    expect(mockGetStepData).not.toHaveBeenCalled();
  });

  it('should handle service errors and return 500', async () => {
    mockValidateProjectAccess.mockResolvedValue({
      project: {
        id: 'project-123',
      } as unknown as ProjectContext,
      success: true,
    });

    mockGetStepData.mockRejectedValue(new Error('Database error'));

    const request = new NextRequest(
      'http://localhost:3001/api/employer-survey/step/2?projectId=project-123&admin_token=valid-token',
    );
    const response = await GET(request, {params: {step: '2'}});
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe('internal_error');
  });
});

describe('POST /api/employer-survey/step/[step]', () => {
  const mockValidateProjectAccess =
    validateProjectAccess as jest.MockedFunction<typeof validateProjectAccess>;
  const mockSaveStepAnswers = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (
      EmployerSurveyService as jest.MockedClass<typeof EmployerSurveyService>
    ).mockImplementation(
      () =>
        ({
          saveStepAnswers: mockSaveStepAnswers,
        }) as unknown as EmployerSurveyService,
    );
  });

  it('should save answers successfully', async () => {
    mockValidateProjectAccess.mockResolvedValue({
      project: {
        id: 'project-123',
      } as unknown as ProjectContext,
      success: true,
    });

    mockSaveStepAnswers.mockResolvedValue(undefined);

    const request = new NextRequest(
      'http://localhost:3001/api/employer-survey/step/2?projectId=project-123&admin_token=valid-token',
      {
        body: JSON.stringify({
          answers: [
            {
              answer_text: 'Test answer',
              question_id: '550e8400-e29b-41d4-a716-446655440000',
            },
          ],
        }),
        method: 'POST',
      },
    );

    const response = await POST(request, {params: {step: '2'}});
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toEqual({success: true});
    expect(mockSaveStepAnswers).toHaveBeenCalledWith('project-123', 2, [
      {
        answer_text: 'Test answer',
        question_id: '550e8400-e29b-41d4-a716-446655440000',
      },
    ]);
  });

  it('should save answers with selected values', async () => {
    mockValidateProjectAccess.mockResolvedValue({
      project: {
        id: 'project-123',
      } as unknown as ProjectContext,
      success: true,
    });

    mockSaveStepAnswers.mockResolvedValue(undefined);

    const request = new NextRequest(
      'http://localhost:3001/api/employer-survey/step/3?projectId=project-123&admin_token=valid-token',
      {
        body: JSON.stringify({
          answers: [
            {
              question_id: '550e8400-e29b-41d4-a716-446655440001',
              selected_values: ['value1', 'value2'],
            },
          ],
        }),
        method: 'POST',
      },
    );

    const response = await POST(request, {params: {step: '3'}});
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toEqual({success: true});
    expect(mockSaveStepAnswers).toHaveBeenCalledWith('project-123', 3, [
      {
        question_id: '550e8400-e29b-41d4-a716-446655440001',
        selected_values: ['value1', 'value2'],
      },
    ]);
  });

  it('should return 400 for invalid step', async () => {
    mockValidateProjectAccess.mockResolvedValue({
      project: {
        id: 'project-123',
      } as unknown as ProjectContext,
      success: true,
    });

    const request = new NextRequest(
      'http://localhost:3001/api/employer-survey/step/invalid?projectId=project-123&admin_token=valid-token',
      {
        body: JSON.stringify({
          answers: [
            {
              answer_text: 'Test',
              question_id: '550e8400-e29b-41d4-a716-446655440002',
            },
          ],
        }),
        method: 'POST',
      },
    );

    const response = await POST(request, {params: {step: 'invalid'}});
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('invalid_step');
    expect(mockSaveStepAnswers).not.toHaveBeenCalled();
  });

  it('should return 401 when validateProjectAccess fails', async () => {
    const errorResponse = NextResponse.json(
      {error: 'unauthorized'},
      {status: 401},
    );

    mockValidateProjectAccess.mockResolvedValue({
      error: errorResponse,
      success: false,
    });

    const request = new NextRequest(
      'http://localhost:3001/api/employer-survey/step/2?projectId=project-123',
      {
        body: JSON.stringify({
          answers: [
            {
              answer_text: 'Test',
              question_id: '550e8400-e29b-41d4-a716-446655440003',
            },
          ],
        }),
        method: 'POST',
      },
    );

    const response = await POST(request, {params: {step: '2'}});
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error).toBe('unauthorized');
    expect(mockSaveStepAnswers).not.toHaveBeenCalled();
  });

  it('should return 400 when request body is invalid (missing answers)', async () => {
    mockValidateProjectAccess.mockResolvedValue({
      project: {
        id: 'project-123',
      } as unknown as ProjectContext,
      success: true,
    });

    const request = new NextRequest(
      'http://localhost:3001/api/employer-survey/step/2?projectId=project-123&admin_token=valid-token',
      {
        body: JSON.stringify({}),
        method: 'POST',
      },
    );

    const response = await POST(request, {params: {step: '2'}});
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('validation_failed');
    expect(mockSaveStepAnswers).not.toHaveBeenCalled();
  });

  it('should return 400 when answers is not an array', async () => {
    mockValidateProjectAccess.mockResolvedValue({
      project: {
        id: 'project-123',
      } as unknown as ProjectContext,
      success: true,
    });

    const request = new NextRequest(
      'http://localhost:3001/api/employer-survey/step/2?projectId=project-123&admin_token=valid-token',
      {
        body: JSON.stringify({answers: 'not-an-array'}),
        method: 'POST',
      },
    );

    const response = await POST(request, {params: {step: '2'}});
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('validation_failed');
    expect(mockSaveStepAnswers).not.toHaveBeenCalled();
  });

  it('should return 400 when question does not belong to step', async () => {
    mockValidateProjectAccess.mockResolvedValue({
      project: {
        id: 'project-123',
      } as unknown as ProjectContext,
      success: true,
    });

    mockSaveStepAnswers.mockRejectedValue(
      new Error(
        'Question 550e8400-e29b-41d4-a716-446655440004 does not belong to step 2',
      ),
    );

    const request = new NextRequest(
      'http://localhost:3001/api/employer-survey/step/2?projectId=project-123&admin_token=valid-token',
      {
        body: JSON.stringify({
          answers: [
            {
              answer_text: 'Test',
              question_id: '550e8400-e29b-41d4-a716-446655440004',
            },
          ],
        }),
        method: 'POST',
      },
    );

    const response = await POST(request, {params: {step: '2'}});
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('invalid_question_for_step');
  });

  it('should return 400 when required answer is missing', async () => {
    mockValidateProjectAccess.mockResolvedValue({
      project: {
        id: 'project-123',
      } as unknown as ProjectContext,
      success: true,
    });

    mockSaveStepAnswers.mockRejectedValue(
      new Error(
        'Answer text is required for question 550e8400-e29b-41d4-a716-446655440005',
      ),
    );

    const request = new NextRequest(
      'http://localhost:3001/api/employer-survey/step/2?projectId=project-123&admin_token=valid-token',
      {
        body: JSON.stringify({
          answers: [{question_id: '550e8400-e29b-41d4-a716-446655440005'}],
        }),
        method: 'POST',
      },
    );

    const response = await POST(request, {params: {step: '2'}});
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('validation_failed');
  });

  it('should return 400 when answer_text must be empty error occurs', async () => {
    mockValidateProjectAccess.mockResolvedValue({
      project: {
        id: 'project-123',
      } as unknown as ProjectContext,
      success: true,
    });

    mockSaveStepAnswers.mockRejectedValue(
      new Error(
        'Answer text must be empty for question 550e8400-e29b-41d4-a716-446655440006',
      ),
    );

    const request = new NextRequest(
      'http://localhost:3001/api/employer-survey/step/2?projectId=project-123&admin_token=valid-token',
      {
        body: JSON.stringify({
          answers: [
            {
              answer_text: 'Should not have text',
              question_id: '550e8400-e29b-41d4-a716-446655440006',
            },
          ],
        }),
        method: 'POST',
      },
    );

    const response = await POST(request, {params: {step: '2'}});
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('validation_failed');
  });

  it('should return 400 when too many values are selected', async () => {
    mockValidateProjectAccess.mockResolvedValue({
      project: {
        id: 'project-123',
      } as unknown as ProjectContext,
      success: true,
    });

    mockSaveStepAnswers.mockRejectedValue(
      new Error(
        'Too many values selected for question 550e8400-e29b-41d4-a716-446655440007',
      ),
    );

    const request = new NextRequest(
      'http://localhost:3001/api/employer-survey/step/2?projectId=project-123&admin_token=valid-token',
      {
        body: JSON.stringify({
          answers: [
            {
              question_id: '550e8400-e29b-41d4-a716-446655440007',
              selected_values: ['v1', 'v2', 'v3'],
            },
          ],
        }),
        method: 'POST',
      },
    );

    const response = await POST(request, {params: {step: '2'}});
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('validation_failed');
  });

  it('should return 500 for other service errors', async () => {
    mockValidateProjectAccess.mockResolvedValue({
      project: {
        id: 'project-123',
      } as unknown as ProjectContext,
      success: true,
    });

    mockSaveStepAnswers.mockRejectedValue(
      new Error('Database connection failed'),
    );

    const request = new NextRequest(
      'http://localhost:3001/api/employer-survey/step/2?projectId=project-123&admin_token=valid-token',
      {
        body: JSON.stringify({
          answers: [
            {
              answer_text: 'Test',
              question_id: '550e8400-e29b-41d4-a716-446655440008',
            },
          ],
        }),
        method: 'POST',
      },
    );

    const response = await POST(request, {params: {step: '2'}});
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe('internal_error');
  });

  it('should handle non-Error exceptions', async () => {
    mockValidateProjectAccess.mockResolvedValue({
      project: {
        id: 'project-123',
      } as unknown as ProjectContext,
      success: true,
    });

    mockSaveStepAnswers.mockRejectedValue('String error');

    const request = new NextRequest(
      'http://localhost:3001/api/employer-survey/step/2?projectId=project-123&admin_token=valid-token',
      {
        body: JSON.stringify({
          answers: [
            {
              answer_text: 'Test',
              question_id: '550e8400-e29b-41d4-a716-446655440009',
            },
          ],
        }),
        method: 'POST',
      },
    );

    const response = await POST(request, {params: {step: '2'}});
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe('internal_error');
  });

  it('should handle empty answers array', async () => {
    mockValidateProjectAccess.mockResolvedValue({
      project: {
        id: 'project-123',
      } as unknown as ProjectContext,
      success: true,
    });

    mockSaveStepAnswers.mockResolvedValue(undefined);

    const request = new NextRequest(
      'http://localhost:3001/api/employer-survey/step/2?projectId=project-123&admin_token=valid-token',
      {
        body: JSON.stringify({
          answers: [],
        }),
        method: 'POST',
      },
    );

    const response = await POST(request, {params: {step: '2'}});
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toEqual({success: true});
    expect(mockSaveStepAnswers).toHaveBeenCalledWith('project-123', 2, []);
  });
});
