/**
 * @jest-environment node
 */
import {NextRequest} from 'next/server';

import {GET, POST} from './route';

import EmployeeSurveyService from '@/lib/services/employeeSurveyService';

jest.mock('@/lib/services/employeeSurveyService');

describe('GET /api/employee-survey/step/[step]', () => {
  const mockGetStepData = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (
      EmployeeSurveyService as jest.MockedClass<typeof EmployeeSurveyService>
    ).mockImplementation(
      () =>
        ({
          getStepData: mockGetStepData,
        }) as unknown as EmployeeSurveyService,
    );
  });

  it('returns step data on success', async () => {
    const mockStepData = {
      questions: [
        {
          answer: null,
          id: 'q1',
          key: 'test_question',
          prompt: 'What do you value most?',
          question_type: 'free_text',
          selection_limit: null,
        },
      ],
      step: 2,
    };

    mockGetStepData.mockResolvedValue(mockStepData);

    const request = new NextRequest(
      'http://localhost:3001/api/employee-survey/step/2?projectId=proj-123&submission_id=sub-abc',
    );
    const response = await GET(request, {params: {step: '2'}});
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toEqual(mockStepData);
    expect(mockGetStepData).toHaveBeenCalledWith('sub-abc', 2);
  });

  it('returns 400 for invalid step (non-numeric)', async () => {
    const request = new NextRequest(
      'http://localhost:3001/api/employee-survey/step/abc?projectId=proj-123&submission_id=sub-abc',
    );
    const response = await GET(request, {params: {step: 'abc'}});
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('invalid_step');
    expect(mockGetStepData).not.toHaveBeenCalled();
  });

  it('returns 400 for step below 1', async () => {
    const request = new NextRequest(
      'http://localhost:3001/api/employee-survey/step/0?projectId=proj-123&submission_id=sub-abc',
    );
    const response = await GET(request, {params: {step: '0'}});
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('invalid_step');
  });

  it('returns 400 for step above 5', async () => {
    const request = new NextRequest(
      'http://localhost:3001/api/employee-survey/step/6?projectId=proj-123&submission_id=sub-abc',
    );
    const response = await GET(request, {params: {step: '6'}});
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('invalid_step');
  });

  it('returns 400 when submission_id is missing', async () => {
    const request = new NextRequest(
      'http://localhost:3001/api/employee-survey/step/2?projectId=proj-123',
    );
    const response = await GET(request, {params: {step: '2'}});
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('missing_field');
    expect(mockGetStepData).not.toHaveBeenCalled();
  });

  it('returns 500 on service error', async () => {
    mockGetStepData.mockRejectedValue(new Error('Database error'));

    const request = new NextRequest(
      'http://localhost:3001/api/employee-survey/step/1?projectId=proj-123&submission_id=sub-abc',
    );
    const response = await GET(request, {params: {step: '1'}});
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe('internal_error');
  });
});

describe('POST /api/employee-survey/step/[step]', () => {
  const mockSaveStepAnswers = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (
      EmployeeSurveyService as jest.MockedClass<typeof EmployeeSurveyService>
    ).mockImplementation(
      () =>
        ({
          saveStepAnswers: mockSaveStepAnswers,
        }) as unknown as EmployeeSurveyService,
    );
  });

  it('saves answers successfully', async () => {
    mockSaveStepAnswers.mockResolvedValue(undefined);

    const request = new NextRequest(
      'http://localhost:3001/api/employee-survey/step/2?projectId=proj-123&submission_id=sub-abc',
      {
        body: JSON.stringify({
          answers: [
            {
              answer_text: 'My answer',
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
    expect(mockSaveStepAnswers).toHaveBeenCalledWith('sub-abc', 2, [
      {
        answer_text: 'My answer',
        question_id: '550e8400-e29b-41d4-a716-446655440000',
      },
    ]);
  });

  it('saves answers with selected_values', async () => {
    mockSaveStepAnswers.mockResolvedValue(undefined);

    const request = new NextRequest(
      'http://localhost:3001/api/employee-survey/step/1?projectId=proj-123&submission_id=sub-abc',
      {
        body: JSON.stringify({
          answers: [
            {
              question_id: '550e8400-e29b-41d4-a716-446655440001',
              selected_values: ['val1', 'val2'],
            },
          ],
        }),
        method: 'POST',
      },
    );
    const response = await POST(request, {params: {step: '1'}});
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toEqual({success: true});
  });

  it('returns 400 for invalid step', async () => {
    const request = new NextRequest(
      'http://localhost:3001/api/employee-survey/step/invalid?projectId=proj-123&submission_id=sub-abc',
      {
        body: JSON.stringify({answers: []}),
        method: 'POST',
      },
    );
    const response = await POST(request, {params: {step: 'invalid'}});
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('invalid_step');
    expect(mockSaveStepAnswers).not.toHaveBeenCalled();
  });

  it('returns 400 when submission_id is missing', async () => {
    const request = new NextRequest(
      'http://localhost:3001/api/employee-survey/step/2?projectId=proj-123',
      {
        body: JSON.stringify({answers: []}),
        method: 'POST',
      },
    );
    const response = await POST(request, {params: {step: '2'}});
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('missing_field');
    expect(mockSaveStepAnswers).not.toHaveBeenCalled();
  });

  it('returns 400 when body is invalid (missing answers)', async () => {
    const request = new NextRequest(
      'http://localhost:3001/api/employee-survey/step/2?projectId=proj-123&submission_id=sub-abc',
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

  it('returns 400 when question does not belong to step', async () => {
    mockSaveStepAnswers.mockRejectedValue(
      new Error(
        'Question 550e8400-e29b-41d4-a716-446655440000 does not belong to step 2',
      ),
    );

    const request = new NextRequest(
      'http://localhost:3001/api/employee-survey/step/2?projectId=proj-123&submission_id=sub-abc',
      {
        body: JSON.stringify({
          answers: [
            {
              answer_text: 'Test',
              question_id: '550e8400-e29b-41d4-a716-446655440000',
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

  it('returns 500 for unexpected service errors', async () => {
    mockSaveStepAnswers.mockRejectedValue(
      new Error('Database connection lost'),
    );

    const request = new NextRequest(
      'http://localhost:3001/api/employee-survey/step/3?projectId=proj-123&submission_id=sub-abc',
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
    const response = await POST(request, {params: {step: '3'}});
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe('internal_error');
  });
});
