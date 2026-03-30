/**
 * @jest-environment node
 */
import {NextRequest, NextResponse} from 'next/server';

import {GET} from './route';

import {
  ProjectContext,
  validateProjectAccess,
} from '@/lib/middleware/validateProjectAccess';
import {AiResultRepository} from '@/lib/repositories/aiResultRepository';
import {EvpAiResult} from '@/lib/types/database';

jest.mock('@/lib/middleware/validateProjectAccess');
jest.mock('@/lib/repositories/aiResultRepository');

describe('GET /api/evp-pipeline/results', () => {
  const mockValidateProjectAccess =
    validateProjectAccess as jest.MockedFunction<typeof validateProjectAccess>;
  const mockFindAllByProject = jest.fn();

  /* eslint-disable sort-keys */
  const mockProject: ProjectContext = {
    admin_token: 'valid-token',
    company_name: 'Test Corp',
    created_at: '2026-01-01',
    id: 'project-123',
    profile_url: 'https://kununu.com/test',
    status: 'evp_generation_available',
    updated_at: '2026-01-01',
  };

  const mockResult1: EvpAiResult = {
    generated_at: '2026-01-02T00:00:00Z',
    id: 'result-1',
    input_snapshot: {},
    model_used: 'data_assembly',
    pipeline_step: 'assembly',
    project_id: 'project-123',
    result_json: {key: 'value'},
    result_text: null,
    target_audience: null,
  };

  const mockResult2: EvpAiResult = {
    generated_at: '2026-01-03T00:00:00Z',
    id: 'result-2',
    input_snapshot: {},
    model_used: 'gpt-4o-mini',
    pipeline_step: 'analysis',
    project_id: 'project-123',
    result_json: {analysis: 'data'},
    result_text: null,
    target_audience: null,
  };
  /* eslint-enable sort-keys */

  function makeRequest(pipelineStep?: string) {
    const params = new URLSearchParams({
      admin_token: 'valid-token',
      projectId: 'project-123',
    });

    if (pipelineStep) {
      params.append('pipeline_step', pipelineStep);
    }

    return new NextRequest(
      `http://localhost:3001/api/evp-pipeline/results?${params.toString()}`,
      {method: 'GET'},
    );
  }

  beforeEach(() => {
    jest.clearAllMocks();

    (
      AiResultRepository as jest.MockedClass<typeof AiResultRepository>
    ).mockImplementation(
      () =>
        ({
          findAllByProject: mockFindAllByProject,
        }) as unknown as AiResultRepository,
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

    const response = await GET(makeRequest());
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error).toBe('invalid_credentials');
    expect(mockFindAllByProject).not.toHaveBeenCalled();
  });

  it('should return 200 with all results when no pipeline_step filter', async () => {
    mockValidateProjectAccess.mockResolvedValue({
      project: mockProject,
      success: true,
    });
    mockFindAllByProject.mockResolvedValue([mockResult1, mockResult2]);

    const response = await GET(makeRequest());
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.results).toEqual([mockResult1, mockResult2]);
    expect(mockFindAllByProject).toHaveBeenCalledWith('project-123', undefined);
  });

  it('should return 200 with filtered results when pipeline_step is provided', async () => {
    mockValidateProjectAccess.mockResolvedValue({
      project: mockProject,
      success: true,
    });
    mockFindAllByProject.mockResolvedValue([mockResult1]);

    const response = await GET(makeRequest('assembly'));
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.results).toEqual([mockResult1]);
    expect(mockFindAllByProject).toHaveBeenCalledWith(
      'project-123',
      'assembly',
    );
  });

  it('should return 200 with empty array when no results found', async () => {
    mockValidateProjectAccess.mockResolvedValue({
      project: mockProject,
      success: true,
    });
    mockFindAllByProject.mockResolvedValue([]);

    const response = await GET(makeRequest());
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.results).toEqual([]);
  });

  it('should return 400 when invalid pipeline_step provided', async () => {
    mockValidateProjectAccess.mockResolvedValue({
      project: mockProject,
      success: true,
    });

    const response = await GET(makeRequest('invalid_step'));
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('invalid_pipeline_step');
    expect(mockFindAllByProject).not.toHaveBeenCalled();
  });

  it.each([
    'assembly',
    'analysis',
    'internal',
    'external',
    'gap_analysis',
  ] as const)('should accept pipeline_step: %s', async step => {
    mockValidateProjectAccess.mockResolvedValue({
      project: mockProject,
      success: true,
    });
    mockFindAllByProject.mockResolvedValue([]);

    const response = await GET(makeRequest(step));

    expect(response.status).toBe(200);
    expect(mockFindAllByProject).toHaveBeenCalledWith('project-123', step);
  });

  it('should return 500 for unexpected errors', async () => {
    mockValidateProjectAccess.mockResolvedValue({
      project: mockProject,
      success: true,
    });
    mockFindAllByProject.mockRejectedValue(new Error('database_error'));

    const response = await GET(makeRequest());
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe('internal_error');
  });

  it('should return 500 for non-Error exceptions', async () => {
    mockValidateProjectAccess.mockResolvedValue({
      project: mockProject,
      success: true,
    });
    mockFindAllByProject.mockRejectedValue('unexpected string error');

    const response = await GET(makeRequest());
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe('internal_error');
  });
});
