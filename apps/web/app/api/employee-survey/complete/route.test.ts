/**
 * @jest-environment node
 */
import {NextRequest} from 'next/server';

import {POST} from './route';

import {SurveySubmissionRepository} from '@/lib/repositories/surveySubmissionRepository';

jest.mock('@/lib/repositories/surveySubmissionRepository');

describe('POST /api/employee-survey/complete', () => {
  const mockMarkAsSubmitted = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();

    (
      SurveySubmissionRepository as jest.MockedClass<
        typeof SurveySubmissionRepository
      >
    ).mockImplementation(
      () =>
        ({
          markAsSubmitted: mockMarkAsSubmitted,
        }) as unknown as SurveySubmissionRepository,
    );
  });

  function makeRequest(submissionId?: string) {
    const url = submissionId
      ? `http://localhost:3001/api/employee-survey/complete?submission_id=${submissionId}`
      : 'http://localhost:3001/api/employee-survey/complete';

    return new NextRequest(url, {method: 'POST'});
  }

  it('should return 400 when submission_id is missing', async () => {
    const request = makeRequest();
    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('missing_field');
    expect(mockMarkAsSubmitted).not.toHaveBeenCalled();
  });

  it('should return 200 with success:true when submission_id is valid', async () => {
    mockMarkAsSubmitted.mockResolvedValue(undefined);

    const request = makeRequest('submission-123');
    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(mockMarkAsSubmitted).toHaveBeenCalledWith('submission-123');
  });

  it('should call markAsSubmitted with the correct submission_id', async () => {
    mockMarkAsSubmitted.mockResolvedValue(undefined);

    const submissionId = 'abc-def-ghi';
    const request = makeRequest(submissionId);

    await POST(request);

    expect(mockMarkAsSubmitted).toHaveBeenCalledWith(submissionId);
    expect(mockMarkAsSubmitted).toHaveBeenCalledTimes(1);
  });

  it('should return 500 when markAsSubmitted throws', async () => {
    mockMarkAsSubmitted.mockRejectedValue(new Error('DB connection failed'));

    const request = makeRequest('submission-123');
    const response = await POST(request);

    expect(response.status).toBe(500);
  });
});
