/**
 * @jest-environment node
 */
import {NextRequest, NextResponse} from 'next/server';

import {POST} from './route';

import {
  ProjectContext,
  validateProjectAccess,
} from '@/lib/middleware/validateProjectAccess';
import AnalysisService from '@/lib/services/analysisService';
import {AnalysisResult} from '@/lib/types/pipeline';

jest.mock('@/lib/middleware/validateProjectAccess');
jest.mock('@/lib/services/analysisService');

describe('POST /api/evp-pipeline/analyze', () => {
  const mockValidateProjectAccess =
    validateProjectAccess as jest.MockedFunction<typeof validateProjectAccess>;
  const mockAnalyze = jest.fn();

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
      'http://localhost:3001/api/evp-pipeline/analyze?projectId=project-123&admin_token=valid-token',
      {method: 'POST'},
    );
  }

  beforeEach(() => {
    jest.clearAllMocks();
    (
      AnalysisService as jest.MockedClass<typeof AnalysisService>
    ).mockImplementation(
      () => ({analyze: mockAnalyze}) as unknown as AnalysisService,
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
    expect(mockAnalyze).not.toHaveBeenCalled();
  });

  it('should return 200 with analysis result on success', async () => {
    mockValidateProjectAccess.mockResolvedValue({
      project: mockProject,
      success: true,
    });
    mockAnalyze.mockResolvedValue(mockAnalysisResult);

    const response = await POST(makeRequest());
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.analysis).toEqual(mockAnalysisResult);
    expect(mockAnalyze).toHaveBeenCalledWith('project-123');
  });

  it('should return 400 when assembly_not_found', async () => {
    mockValidateProjectAccess.mockResolvedValue({
      project: mockProject,
      success: true,
    });
    mockAnalyze.mockRejectedValue(new Error('assembly_not_found'));

    const response = await POST(makeRequest());
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('assembly_not_found');
    expect(data.message).toContain('assemble');
  });

  it('should return 400 when analysis_validation_failed', async () => {
    mockValidateProjectAccess.mockResolvedValue({
      project: mockProject,
      success: true,
    });
    mockAnalyze.mockRejectedValue(new Error('analysis_validation_failed'));

    const response = await POST(makeRequest());
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('analysis_validation_failed');
    expect(data.message).toContain('schema');
  });

  it('should return 500 for unexpected errors', async () => {
    mockValidateProjectAccess.mockResolvedValue({
      project: mockProject,
      success: true,
    });
    mockAnalyze.mockRejectedValue(new Error('rate_limit_exceeded'));

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
    mockAnalyze.mockRejectedValue('unexpected string error');

    const response = await POST(makeRequest());
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe('internal_error');
  });
});
