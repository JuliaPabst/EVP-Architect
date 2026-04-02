/**
 * @jest-environment node
 */
import {NextRequest, NextResponse} from 'next/server';

import {POST} from './route';

import {
  ProjectContext,
  validateProjectAccess,
} from '@/lib/middleware/validateProjectAccess';
import {EvpCommentRepository} from '@/lib/repositories/evpCommentRepository';
import AnalysisService from '@/lib/services/analysisService';
import DataAssemblyService from '@/lib/services/dataAssemblyService';
import EvpOutputService from '@/lib/services/evpOutputService';
import {AnalysisResult} from '@/lib/types/pipeline';

jest.mock('@/lib/middleware/validateProjectAccess');
jest.mock('@/lib/repositories/evpCommentRepository');
jest.mock('@/lib/services/analysisService');
jest.mock('@/lib/services/dataAssemblyService');
jest.mock('@/lib/services/evpOutputService');

describe('POST /api/evp-pipeline/regenerate', () => {
  const mockValidateProjectAccess =
    validateProjectAccess as jest.MockedFunction<typeof validateProjectAccess>;
  const mockAssemble = jest.fn();
  const mockAnalyze = jest.fn();
  const mockFindAllComments = jest.fn();
  const mockGenerate = jest.fn();
  const mockSaveComment = jest.fn();

  /* eslint-disable sort-keys */
  const mockProject: ProjectContext = {
    admin_token: 'valid-token',
    company_name: 'Test Corp',
    created_at: '2026-01-01',
    id: 'project-123',
    profile_url: 'https://kununu.com/test',
    status: 'evp_generated',
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

  function makeRequest(
    scope: string,
    outputType?: string,
    targetAudience?: string,
  ) {
    const params = new URLSearchParams({
      admin_token: 'valid-token',
      projectId: 'project-123',
      scope,
    });

    if (outputType) {
      params.append('outputType', outputType);
    }

    if (targetAudience) {
      params.append('targetAudience', targetAudience);
    }

    return new NextRequest(
      `http://localhost:3001/api/evp-pipeline/regenerate?${params.toString()}`,
      {method: 'POST'},
    );
  }

  beforeEach(() => {
    jest.clearAllMocks();

    mockFindAllComments.mockResolvedValue([]);

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
      EvpCommentRepository as jest.MockedClass<typeof EvpCommentRepository>
    ).mockImplementation(
      () =>
        ({
          findAllByProjectAndOutputType: mockFindAllComments,
          save: mockSaveComment,
        }) as unknown as EvpCommentRepository,
    );

    (
      EvpOutputService as jest.MockedClass<typeof EvpOutputService>
    ).mockImplementation(
      () => ({generate: mockGenerate}) as unknown as EvpOutputService,
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

    const response = await POST(makeRequest('full'));
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error).toBe('invalid_credentials');
    expect(mockAssemble).not.toHaveBeenCalled();
  });

  it('should return 400 when scope is missing', async () => {
    mockValidateProjectAccess.mockResolvedValue({
      project: mockProject,
      success: true,
    });

    const request = new NextRequest(
      'http://localhost:3001/api/evp-pipeline/regenerate?projectId=project-123&admin_token=valid-token',
      {method: 'POST'},
    );

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('invalid_scope');
    expect(mockAssemble).not.toHaveBeenCalled();
  });

  it('should return 400 when scope is invalid', async () => {
    mockValidateProjectAccess.mockResolvedValue({
      project: mockProject,
      success: true,
    });

    const response = await POST(makeRequest('invalid'));
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('invalid_scope');
    expect(mockAssemble).not.toHaveBeenCalled();
  });

  // Scope "full" tests
  it('should return 200 with analysis for scope=full', async () => {
    mockValidateProjectAccess.mockResolvedValue({
      project: mockProject,
      success: true,
    });
    mockAssemble.mockResolvedValue({});
    mockAnalyze.mockResolvedValue(mockAnalysisResult);

    const response = await POST(makeRequest('full'));
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.analysis).toEqual(mockAnalysisResult);
    expect(mockAssemble).toHaveBeenCalledWith('project-123');
    expect(mockAnalyze).toHaveBeenCalledWith('project-123');
    expect(mockGenerate).not.toHaveBeenCalled();
  });

  it('should return 400 when insufficient_submissions for scope=full', async () => {
    mockValidateProjectAccess.mockResolvedValue({
      project: mockProject,
      success: true,
    });
    mockAssemble.mockRejectedValue(new Error('insufficient_submissions'));

    const response = await POST(makeRequest('full'));
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('insufficient_submissions');
    expect(mockAnalyze).not.toHaveBeenCalled();
  });

  it('should return 400 when analysis_validation_failed for scope=full', async () => {
    mockValidateProjectAccess.mockResolvedValue({
      project: mockProject,
      success: true,
    });
    mockAssemble.mockResolvedValue({});
    mockAnalyze.mockRejectedValue(new Error('analysis_validation_failed'));

    const response = await POST(makeRequest('full'));
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('analysis_validation_failed');
  });

  it('should return 400 when assembly_not_found for scope=full', async () => {
    mockValidateProjectAccess.mockResolvedValue({
      project: mockProject,
      success: true,
    });
    mockAssemble.mockResolvedValue({});
    mockAnalyze.mockRejectedValue(new Error('assembly_not_found'));

    const response = await POST(makeRequest('full'));
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('assembly_not_found');
  });

  // Scope "output" tests
  it('should return 200 with text for scope=output', async () => {
    mockValidateProjectAccess.mockResolvedValue({
      project: mockProject,
      success: true,
    });
    mockGenerate.mockResolvedValue('Generated EVP text');

    const response = await POST(makeRequest('output', 'internal'));

    expect(response.status).toBe(200);
    expect((await response.json()).text).toBe('Generated EVP text');
    expect(mockGenerate).toHaveBeenCalledWith(
      'project-123',
      'internal',
      undefined,
      [],
      undefined,
      undefined,
    );
    expect(mockAssemble).not.toHaveBeenCalled();
  });

  it('should return 200 with targetAudience for scope=output external', async () => {
    mockValidateProjectAccess.mockResolvedValue({
      project: mockProject,
      success: true,
    });
    mockGenerate.mockResolvedValue('Generated EVP text');

    const response = await POST(
      makeRequest('output', 'external', 'engineering'),
    );

    expect(response.status).toBe(200);
    expect((await response.json()).text).toBe('Generated EVP text');
    expect(mockGenerate).toHaveBeenCalledWith(
      'project-123',
      'external',
      'engineering',
      [],
      undefined,
      undefined,
    );
  });

  it('should return 400 when outputType is missing for scope=output', async () => {
    mockValidateProjectAccess.mockResolvedValue({
      project: mockProject,
      success: true,
    });

    const params = new URLSearchParams({
      admin_token: 'valid-token',
      projectId: 'project-123',
      scope: 'output',
    });
    const request = new NextRequest(
      `http://localhost:3001/api/evp-pipeline/regenerate?${params.toString()}`,
      {method: 'POST'},
    );

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('invalid_output_type');
    expect(mockGenerate).not.toHaveBeenCalled();
  });

  it('should return 400 when outputType is invalid for scope=output', async () => {
    mockValidateProjectAccess.mockResolvedValue({
      project: mockProject,
      success: true,
    });

    const response = await POST(makeRequest('output', 'invalid_type'));
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('invalid_output_type');
    expect(mockGenerate).not.toHaveBeenCalled();
  });

  it('should return 400 when analysis_not_found for scope=output', async () => {
    mockValidateProjectAccess.mockResolvedValue({
      project: mockProject,
      success: true,
    });
    mockGenerate.mockRejectedValue(new Error('analysis_not_found'));

    const response = await POST(makeRequest('output', 'internal'));
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('analysis_not_found');
  });

  it('should return 400 when assembly_not_found for scope=output', async () => {
    mockValidateProjectAccess.mockResolvedValue({
      project: mockProject,
      success: true,
    });
    mockGenerate.mockRejectedValue(new Error('assembly_not_found'));

    const response = await POST(makeRequest('output', 'internal'));
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('assembly_not_found');
  });

  it('should return 500 when claude_content_filtered for scope=output', async () => {
    mockValidateProjectAccess.mockResolvedValue({
      project: mockProject,
      success: true,
    });
    mockGenerate.mockRejectedValue(new Error('claude_content_filtered'));

    const response = await POST(makeRequest('output', 'internal'));
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe('generation_failed');
  });

  it.each(['internal', 'external', 'gap_analysis'] as const)(
    'should accept outputType: %s',
    async outputType => {
      mockValidateProjectAccess.mockResolvedValue({
        project: mockProject,
        success: true,
      });
      mockGenerate.mockResolvedValue('Generated text');

      const response = await POST(makeRequest('output', outputType));

      expect(response.status).toBe(200);
      expect(mockGenerate).toHaveBeenCalledWith(
        'project-123',
        outputType,
        undefined,
        [],
        undefined,
        undefined,
      );
    },
  );

  it('should return 500 for unexpected errors in scope=full', async () => {
    mockValidateProjectAccess.mockResolvedValue({
      project: mockProject,
      success: true,
    });
    mockAssemble.mockResolvedValue({});
    mockAnalyze.mockRejectedValue(new Error('rate_limit_exceeded'));

    const response = await POST(makeRequest('full'));
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe('internal_error');
  });

  it('should return 500 for unexpected errors in scope=output', async () => {
    mockValidateProjectAccess.mockResolvedValue({
      project: mockProject,
      success: true,
    });
    mockGenerate.mockRejectedValue(new Error('unexpected_error'));

    const response = await POST(makeRequest('output', 'internal'));
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe('internal_error');
  });

  it('should return 500 for non-Error exceptions in scope=full', async () => {
    mockValidateProjectAccess.mockResolvedValue({
      project: mockProject,
      success: true,
    });
    mockAssemble.mockResolvedValue({});
    mockAnalyze.mockRejectedValue('unexpected string error');

    const response = await POST(makeRequest('full'));
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe('internal_error');
  });

  it('should return 500 for non-Error exceptions in scope=output', async () => {
    mockValidateProjectAccess.mockResolvedValue({
      project: mockProject,
      success: true,
    });
    mockGenerate.mockRejectedValue('unexpected string error');

    const response = await POST(makeRequest('output', 'internal'));
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe('internal_error');
  });
});
