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

jest.mock('@/lib/middleware/validateProjectAccess');
jest.mock('@/lib/repositories/evpCommentRepository');

describe('POST /api/evp-pipeline/comments', () => {
  const mockValidateProjectAccess =
    validateProjectAccess as jest.MockedFunction<typeof validateProjectAccess>;
  const mockSave = jest.fn();

  const mockProject: ProjectContext = {
    admin_token: 'valid-token',
    company_name: 'Test Corp',
    created_at: '2026-01-01',
    id: 'project-123',
    profile_url: 'https://kununu.com/test',
    status: 'evp_generated',
    updated_at: '2026-01-01',
  };

  beforeEach(() => {
    jest.clearAllMocks();

    (
      EvpCommentRepository as jest.MockedClass<typeof EvpCommentRepository>
    ).mockImplementation(
      () => ({save: mockSave}) as unknown as EvpCommentRepository,
    );
  });

  function makeRequest(body: unknown) {
    return new NextRequest(
      'http://localhost:3001/api/evp-pipeline/comments?projectId=project-123',
      {
        body: JSON.stringify(body),
        headers: {
          'Content-Type': 'application/json',
          'x-admin-token': 'valid-token',
        },
        method: 'POST',
      },
    );
  }

  it('should return 401 when validateProjectAccess fails', async () => {
    const errorResponse = NextResponse.json(
      {error: 'invalid_credentials', message: 'Unauthorized'},
      {status: 401},
    );

    mockValidateProjectAccess.mockResolvedValue({
      error: errorResponse,
      success: false,
    });

    const response = await POST(
      makeRequest({commentText: 'Test', outputType: 'internal'}),
    );
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error).toBe('invalid_credentials');
    expect(mockSave).not.toHaveBeenCalled();
  });

  it('should return 400 when request body is invalid JSON', async () => {
    mockValidateProjectAccess.mockResolvedValue({
      project: mockProject,
      success: true,
    });

    const request = new NextRequest(
      'http://localhost:3001/api/evp-pipeline/comments?projectId=project-123',
      {
        body: 'not-valid-json',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-token': 'valid-token',
        },
        method: 'POST',
      },
    );

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('invalid_json');
    expect(mockSave).not.toHaveBeenCalled();
  });

  it('should return 400 when commentText is missing', async () => {
    mockValidateProjectAccess.mockResolvedValue({
      project: mockProject,
      success: true,
    });

    const response = await POST(makeRequest({outputType: 'internal'}));
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('missing_fields');
    expect(mockSave).not.toHaveBeenCalled();
  });

  it('should return 400 when outputType is missing', async () => {
    mockValidateProjectAccess.mockResolvedValue({
      project: mockProject,
      success: true,
    });

    const response = await POST(makeRequest({commentText: 'Test comment'}));
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('missing_fields');
    expect(mockSave).not.toHaveBeenCalled();
  });

  it('should return 400 when commentText is not a string', async () => {
    mockValidateProjectAccess.mockResolvedValue({
      project: mockProject,
      success: true,
    });

    const response = await POST(
      makeRequest({commentText: 123, outputType: 'internal'}),
    );
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('invalid_fields');
    expect(mockSave).not.toHaveBeenCalled();
  });

  it('should return 400 when outputType is invalid', async () => {
    mockValidateProjectAccess.mockResolvedValue({
      project: mockProject,
      success: true,
    });

    const response = await POST(
      makeRequest({commentText: 'Test', outputType: 'invalid_type'}),
    );
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('invalid_output_type');
    expect(mockSave).not.toHaveBeenCalled();
  });

  it('should save comment and return it for internal outputType', async () => {
    mockValidateProjectAccess.mockResolvedValue({
      project: mockProject,
      success: true,
    });

    const savedComment = {
      comment_text: 'Please make it shorter',
      created_at: '2026-01-01T00:00:00Z',
      id: 'comment-1',
      output_type: 'internal',
      project_id: 'project-123',
    };

    mockSave.mockResolvedValue(savedComment);

    const response = await POST(
      makeRequest({
        commentText: 'Please make it shorter',
        outputType: 'internal',
      }),
    );
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toEqual(savedComment);
    expect(mockSave).toHaveBeenCalledWith({
      comment_text: 'Please make it shorter',
      output_type: 'internal',
      project_id: 'project-123',
    });
  });

  it('should save comment for external outputType', async () => {
    mockValidateProjectAccess.mockResolvedValue({
      project: mockProject,
      success: true,
    });

    mockSave.mockResolvedValue({
      comment_text: 'More candidate-focused',
      comment_type: 'external',
      id: 'comment-2',
      project_id: 'project-123',
    });

    const response = await POST(
      makeRequest({
        commentText: 'More candidate-focused',
        outputType: 'external',
      }),
    );

    expect(response.status).toBe(200);
    expect(mockSave).toHaveBeenCalledWith({
      comment_text: 'More candidate-focused',
      output_type: 'external',
      project_id: 'project-123',
    });
  });

  it('should save comment for gap_analysis outputType', async () => {
    mockValidateProjectAccess.mockResolvedValue({
      project: mockProject,
      success: true,
    });

    mockSave.mockResolvedValue({
      comment_text: 'Add more risks',
      id: 'comment-3',
      project_id: 'project-123',
    });

    const response = await POST(
      makeRequest({commentText: 'Add more risks', outputType: 'gap_analysis'}),
    );

    expect(response.status).toBe(200);
    expect(mockSave).toHaveBeenCalledWith({
      comment_text: 'Add more risks',
      output_type: 'gap_analysis',
      project_id: 'project-123',
    });
  });

  it('should return 500 when repository save throws', async () => {
    mockValidateProjectAccess.mockResolvedValue({
      project: mockProject,
      success: true,
    });

    mockSave.mockRejectedValue(new Error('Failed to save comment: DB error'));

    const response = await POST(
      makeRequest({commentText: 'Test comment', outputType: 'internal'}),
    );

    expect(response.status).toBe(500);
  });
});
