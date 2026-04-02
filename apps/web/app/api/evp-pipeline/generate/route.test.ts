/**
 * @jest-environment node
 */
import {NextRequest} from 'next/server';

import {POST} from './route';

import {validateProjectAccess} from '@/lib/middleware/validateProjectAccess';
import EvpOutputService from '@/lib/services/evpOutputService';

jest.mock('@/lib/middleware/validateProjectAccess');
jest.mock('@/lib/services/evpOutputService');

describe('POST /api/evp-pipeline/generate', () => {
  const mockProjectId = 'project-123';
  const mockAdminToken = 'token-123';
  const mockOutputText = 'Generated EVP text...';

  let mockServiceInstance: {generate: jest.Mock};

  function makeRequest(
    outputType?: string,
    targetAudience?: string,
  ): NextRequest {
    let url = `http://localhost:3000/api/evp-pipeline/generate?projectId=${mockProjectId}`;

    if (outputType) {
      url += `&outputType=${outputType}`;
    }

    if (targetAudience) {
      url += `&targetAudience=${encodeURIComponent(targetAudience)}`;
    }

    return new NextRequest(url, {
      headers: {
        'x-admin-token': mockAdminToken,
      },
      method: 'POST',
    });
  }

  beforeEach(() => {
    jest.clearAllMocks();

    (validateProjectAccess as jest.Mock).mockResolvedValue({
      project: {
        admin_token: mockAdminToken,
        company_name: 'Test Corp',
        created_at: '2026-03-01T00:00:00Z',
        id: mockProjectId,
        profile_url: 'https://example.com',
        status: 'evp_generation_available',
        updated_at: '2026-03-30T10:00:00Z',
      },
      success: true,
    });

    mockServiceInstance = {
      generate: jest.fn().mockResolvedValue(mockOutputText),
    };

    (
      EvpOutputService as jest.MockedClass<typeof EvpOutputService>
    ).mockImplementation(
      () => mockServiceInstance as unknown as EvpOutputService,
    );
  });

  it('returns 401 when authentication fails', async () => {
    (validateProjectAccess as jest.Mock).mockResolvedValueOnce({
      error: {
        json: () => Promise.resolve({error: 'invalid_credentials'}),
        status: 401,
      },
      success: false,
    });

    const request = makeRequest('internal');
    const response = await POST(request);

    expect(response.status).toBe(401);
  });

  it('returns 400 when outputType is missing', async () => {
    const request = makeRequest(); // no outputType
    const response = await POST(request);

    expect(response.status).toBe(400);
    const body = await response.json();

    expect(body.error).toBe('invalid_output_type');
  });

  it('returns 400 when outputType is invalid', async () => {
    const request = makeRequest('invalid_type');
    const response = await POST(request);

    expect(response.status).toBe(400);
    const body = await response.json();

    expect(body.error).toBe('invalid_output_type');
  });

  it('returns 200 with text for internal EVP', async () => {
    const request = makeRequest('internal');
    const response = await POST(request);

    expect(response.status).toBe(200);
    const body = await response.json();

    expect(body.text).toBe(mockOutputText);
  });

  it('returns 200 with text for external EVP', async () => {
    const request = makeRequest('external');
    const response = await POST(request);

    expect(response.status).toBe(200);
    const body = await response.json();

    expect(body.text).toBe(mockOutputText);
  });

  it('returns 200 with text for gap_analysis', async () => {
    const request = makeRequest('gap_analysis');
    const response = await POST(request);

    expect(response.status).toBe(200);
    const body = await response.json();

    expect(body.text).toBe(mockOutputText);
  });

  it('passes targetAudience to service when provided for external EVP', async () => {
    const request = makeRequest('external', 'software engineers');

    await POST(request);

    expect(mockServiceInstance.generate).toHaveBeenCalledWith(
      mockProjectId,
      'external',
      'software engineers',
      undefined,
      undefined,
      undefined,
    );
  });

  it('does not pass targetAudience for internal EVP', async () => {
    const request = makeRequest('internal', 'software engineers');

    await POST(request);

    expect(mockServiceInstance.generate).toHaveBeenCalledWith(
      mockProjectId,
      'internal',
      'software engineers',
      undefined,
      undefined,
      undefined,
    );
  });

  it('returns 400 when analysis_not_found error is thrown', async () => {
    mockServiceInstance.generate.mockRejectedValueOnce(
      new Error('analysis_not_found'),
    );

    const request = makeRequest('internal');
    const response = await POST(request);

    expect(response.status).toBe(400);
    const body = await response.json();

    expect(body.error).toBe('analysis_not_found');
    expect(body.message).toContain('analyze');
  });

  it('returns 400 when assembly_not_found error is thrown', async () => {
    mockServiceInstance.generate.mockRejectedValueOnce(
      new Error('assembly_not_found'),
    );

    const request = makeRequest('internal');
    const response = await POST(request);

    expect(response.status).toBe(400);
    const body = await response.json();

    expect(body.error).toBe('assembly_not_found');
    expect(body.message).toContain('assemble');
  });

  it('returns 500 when claude_content_filtered error is thrown', async () => {
    mockServiceInstance.generate.mockRejectedValueOnce(
      new Error('claude_content_filtered'),
    );

    const request = makeRequest('internal');
    const response = await POST(request);

    expect(response.status).toBe(500);
    const body = await response.json();

    expect(body.error).toBe('generation_failed');
  });

  it('returns 500 when other errors occur', async () => {
    mockServiceInstance.generate.mockRejectedValueOnce(
      new Error('Internal server error'),
    );

    const request = makeRequest('internal');
    const response = await POST(request);

    expect(response.status).toBe(500);
    const body = await response.json();

    expect(body.error).toBe('internal_error');
  });

  it('returns 200 for external EVP without targetAudience', async () => {
    const request = makeRequest('external');
    const response = await POST(request);

    expect(response.status).toBe(200);
    const body = await response.json();

    expect(body.text).toBe(mockOutputText);

    expect(mockServiceInstance.generate).toHaveBeenCalledWith(
      mockProjectId,
      'external',
      undefined,
      undefined,
      undefined,
      undefined,
    );
  });

  it('returns 200 for gap_analysis without targetAudience', async () => {
    const request = makeRequest('gap_analysis');
    const response = await POST(request);

    expect(response.status).toBe(200);
    const body = await response.json();

    expect(body.text).toBe(mockOutputText);

    expect(mockServiceInstance.generate).toHaveBeenCalledWith(
      mockProjectId,
      'gap_analysis',
      undefined,
      undefined,
      undefined,
      undefined,
    );
  });
});
