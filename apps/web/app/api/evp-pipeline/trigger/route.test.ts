/**
 * @jest-environment node
 */
import {NextRequest, NextResponse} from 'next/server';

import {POST} from './route';

import {
  ProjectContext,
  validateProjectAccess,
} from '@/lib/middleware/validateProjectAccess';
import {ProjectRepository} from '@/lib/repositories/projectRepository';
import AnalysisService from '@/lib/services/analysisService';
import DataAssemblyService from '@/lib/services/dataAssemblyService';
import {AnalysisResult} from '@/lib/types/pipeline';

jest.mock('@/lib/middleware/validateProjectAccess');
jest.mock('@/lib/services/analysisService');
jest.mock('@/lib/services/dataAssemblyService');
jest.mock('@/lib/repositories/projectRepository');

describe('POST /api/evp-pipeline/trigger', () => {
  const mockValidateProjectAccess =
    validateProjectAccess as jest.MockedFunction<typeof validateProjectAccess>;
  const mockAssemble = jest.fn();
  const mockAnalyze = jest.fn();
  const mockUpdateStatus = jest.fn();

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

  const mockAnalysisResult: AnalysisResult = {
    cross_question_patterns: [],
    data_gaps: [],
    evp_pillars: [],
    per_question_signals: [],
    risk_signals: [],
    sample_size_note: 'Based on 3 employee responses.',
    total_respondents: 3,
    value_tensions: [],
  };
  /* eslint-enable sort-keys */

  function makeRequest() {
    return new NextRequest(
      'http://localhost:3001/api/evp-pipeline/trigger?projectId=project-123&admin_token=valid-token',
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

    (
      AnalysisService as jest.MockedClass<typeof AnalysisService>
    ).mockImplementation(
      () => ({analyze: mockAnalyze}) as unknown as AnalysisService,
    );

    (
      ProjectRepository as jest.MockedClass<typeof ProjectRepository>
    ).mockImplementation(
      () => ({updateStatus: mockUpdateStatus}) as unknown as ProjectRepository,
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

  it('should return 400 when project status is not evp_generation_available', async () => {
    const wrongStatusProject: ProjectContext = {
      ...mockProject,
      status: 'evp_generated',
    };

    mockValidateProjectAccess.mockResolvedValue({
      project: wrongStatusProject,
      success: true,
    });

    const response = await POST(makeRequest());
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('project_not_in_correct_state');
    expect(mockAssemble).not.toHaveBeenCalled();
  });

  it('should return 200 with analysis result on success', async () => {
    mockValidateProjectAccess.mockResolvedValue({
      project: mockProject,
      success: true,
    });
    mockAssemble.mockResolvedValue({});
    mockAnalyze.mockResolvedValue(mockAnalysisResult);
    mockUpdateStatus.mockResolvedValue(undefined);

    const response = await POST(makeRequest());
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.analysis).toEqual(mockAnalysisResult);
    expect(mockAssemble).toHaveBeenCalledWith('project-123');
    expect(mockAnalyze).toHaveBeenCalledWith('project-123');
    expect(mockUpdateStatus).toHaveBeenCalledWith(
      'project-123',
      'evp_generated',
    );
  });

  it('should return 400 when insufficient_submissions', async () => {
    mockValidateProjectAccess.mockResolvedValue({
      project: mockProject,
      success: true,
    });
    mockAssemble.mockRejectedValue(new Error('insufficient_submissions'));

    const response = await POST(makeRequest());
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('insufficient_submissions');
    expect(data.message).toContain('3 submitted');
    expect(mockAnalyze).not.toHaveBeenCalled();
    expect(mockUpdateStatus).not.toHaveBeenCalled();
  });

  it('should return 400 when assembly_not_found', async () => {
    mockValidateProjectAccess.mockResolvedValue({
      project: mockProject,
      success: true,
    });
    mockAssemble.mockResolvedValue({});
    mockAnalyze.mockRejectedValue(new Error('assembly_not_found'));

    const response = await POST(makeRequest());
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('assembly_not_found');
    expect(mockUpdateStatus).not.toHaveBeenCalled();
  });

  it('should return 400 when analysis_validation_failed', async () => {
    mockValidateProjectAccess.mockResolvedValue({
      project: mockProject,
      success: true,
    });
    mockAssemble.mockResolvedValue({});
    mockAnalyze.mockRejectedValue(new Error('analysis_validation_failed'));

    const response = await POST(makeRequest());
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('analysis_validation_failed');
    expect(mockUpdateStatus).not.toHaveBeenCalled();
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
    expect(data.error).toBe('project_not_found');
    expect(mockUpdateStatus).not.toHaveBeenCalled();
  });

  it('should return 500 for unexpected errors', async () => {
    mockValidateProjectAccess.mockResolvedValue({
      project: mockProject,
      success: true,
    });
    mockAssemble.mockResolvedValue({});
    mockAnalyze.mockRejectedValue(new Error('rate_limit_exceeded'));

    const response = await POST(makeRequest());
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe('internal_error');
    expect(mockUpdateStatus).not.toHaveBeenCalled();
  });

  it('should return 500 for non-Error exceptions', async () => {
    mockValidateProjectAccess.mockResolvedValue({
      project: mockProject,
      success: true,
    });
    mockAssemble.mockResolvedValue({});
    mockAnalyze.mockRejectedValue('unexpected string error');

    const response = await POST(makeRequest());
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe('internal_error');
    expect(mockUpdateStatus).not.toHaveBeenCalled();
  });
});
