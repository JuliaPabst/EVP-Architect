/**
 * @jest-environment node
 */
import {NextRequest} from 'next/server';

import {POST} from './route';

import EmployeeSurveyService from '@/lib/services/employeeSurveyService';

jest.mock('@/lib/services/employeeSurveyService');

describe('POST /api/employee-survey/submission', () => {
  const mockGetOrCreateSubmission = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (
      EmployeeSurveyService as jest.MockedClass<typeof EmployeeSurveyService>
    ).mockImplementation(
      () =>
        ({
          getOrCreateSubmission: mockGetOrCreateSubmission,
        }) as unknown as EmployeeSurveyService,
    );
  });

  it('returns submission_id on success without existing submission', async () => {
    mockGetOrCreateSubmission.mockResolvedValue({id: 'new-sub-123'});

    const request = new NextRequest(
      'http://localhost:3001/api/employee-survey/submission?projectId=proj-abc',
      {method: 'POST'},
    );
    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toEqual({submission_id: 'new-sub-123'});
    expect(mockGetOrCreateSubmission).toHaveBeenCalledWith(null, 'proj-abc');
  });

  it('passes existing submission_id when provided', async () => {
    mockGetOrCreateSubmission.mockResolvedValue({id: 'existing-sub-456'});

    const request = new NextRequest(
      'http://localhost:3001/api/employee-survey/submission?projectId=proj-abc&submission_id=existing-sub-456',
      {method: 'POST'},
    );
    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toEqual({submission_id: 'existing-sub-456'});
    expect(mockGetOrCreateSubmission).toHaveBeenCalledWith(
      'existing-sub-456',
      'proj-abc',
    );
  });

  it('returns 400 when projectId is missing', async () => {
    const request = new NextRequest(
      'http://localhost:3001/api/employee-survey/submission',
      {method: 'POST'},
    );
    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('missing_field');
    expect(mockGetOrCreateSubmission).not.toHaveBeenCalled();
  });

  it('returns 500 on service error', async () => {
    mockGetOrCreateSubmission.mockRejectedValue(new Error('Database error'));

    const request = new NextRequest(
      'http://localhost:3001/api/employee-survey/submission?projectId=proj-abc',
      {method: 'POST'},
    );
    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe('internal_error');
  });
});
