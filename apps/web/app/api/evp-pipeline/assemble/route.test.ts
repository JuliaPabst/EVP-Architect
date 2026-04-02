/**
 * @jest-environment node
 */
import {NextRequest, NextResponse} from 'next/server';

import {POST} from './route';

import {
  ProjectContext,
  validateProjectAccess,
} from '@/lib/middleware/validateProjectAccess';
import DataAssemblyService from '@/lib/services/dataAssemblyService';

jest.mock('@/lib/middleware/validateProjectAccess');
jest.mock('@/lib/services/dataAssemblyService');

describe('POST /api/evp-pipeline/assemble', () => {
  const mockValidateProjectAccess =
    validateProjectAccess as jest.MockedFunction<typeof validateProjectAccess>;
  const mockAssemble = jest.fn();

  const mockProject: ProjectContext = {
    admin_token: 'valid-token',
    company_name: 'Test Corp',
    created_at: '2026-01-01',
    id: 'project-123',
    profile_url: 'https://kununu.com/test',
    status: 'evp_generation_available',
    updated_at: '2026-01-01',
  };

  function makeRequest(projectId = 'project-123') {
    return new NextRequest(
      `http://localhost:3001/api/evp-pipeline/assemble?projectId=${projectId}&admin_token=valid-token`,
      {method: 'POST'},
    );
  }

  beforeEach(() => {
    jest.clearAllMocks();
    (
      DataAssemblyService as jest.MockedClass<typeof DataAssemblyService>
    ).mockImplementation(
      () => ({assemble: mockAssemble}) as unknown as DataAssemblyService,
    );
  });

  it('should return 401 when validateProjectAccess fails', async () => {
    const errorResponse = NextResponse.json(
      {error: 'invalid_credentials', message: 'Unauthorized'},
      {status: 401},
    );

    mockValidateProjectAccess.mockResolvedValue({
      error: errorResponse,
      success: false,
    });

    const response = await POST(makeRequest());
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error).toBe('invalid_credentials');
    expect(mockAssemble).not.toHaveBeenCalled();
  });

  it('should call assemble with the project ID from validated context', async () => {
    /* eslint-disable sort-keys */
    const mockPayload = {
      company_context: {
        company_name: 'Test',
        employee_count: null,
        industry_name: null,
        location: null,
      },
      data_quality: {
        completion_rate: 1,
        questions_below_threshold: [],
        total_submissions: 3,
      },
      employee_survey: {},
      employer_survey: null,
      project_id: 'project-123',
    };
    /* eslint-enable sort-keys */

    mockValidateProjectAccess.mockResolvedValue({
      project: mockProject,
      success: true,
    });
    mockAssemble.mockResolvedValue(mockPayload);

    const response = await POST(makeRequest());
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.payload).toEqual(mockPayload);
    expect(mockAssemble).toHaveBeenCalledWith('project-123');
  });

  it('should return 400 with insufficient_submissions message', async () => {
    mockValidateProjectAccess.mockResolvedValue({
      project: mockProject,
      success: true,
    });
    mockAssemble.mockRejectedValue(new Error('insufficient_submissions'));

    const response = await POST(makeRequest());
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('insufficient_submissions');
    expect(data.message).toContain('3');
  });

  it('should return 400 when project_not_found', async () => {
    mockValidateProjectAccess.mockResolvedValue({
      project: mockProject,
      success: true,
    });
    mockAssemble.mockRejectedValue(new Error('project_not_found'));

    const response = await POST(makeRequest());
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('missing_field');
  });

  it('should return 500 for unexpected service errors', async () => {
    mockValidateProjectAccess.mockResolvedValue({
      project: mockProject,
      success: true,
    });
    mockAssemble.mockRejectedValue(new Error('Database connection failed'));

    const response = await POST(makeRequest());
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe('internal_error');
  });

  it('should return 500 for non-Error exceptions', async () => {
    mockValidateProjectAccess.mockResolvedValue({
      project: mockProject,
      success: true,
    });
    mockAssemble.mockRejectedValue('string error');

    const response = await POST(makeRequest());
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe('internal_error');
  });
});
