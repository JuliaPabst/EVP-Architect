/**
 * @jest-environment node
 */

// Mocks must be before imports
import {NextRequest} from 'next/server';

import {GET} from './route';

// eslint-disable-next-line import/extensions, import/no-unresolved
import {supabase} from '@/lib/supabase';

jest.mock('@/lib/supabase', () => ({
  supabase: {
    from: jest.fn(),
  },
}));

describe('GET /api/projects/validate-admin', () => {
  const mockProjectId = '123e4567-e89b-12d3-a456-426614174000';
  const mockAdminToken = 'test-admin-token';
  const mockProjectData = {
    admin_token: mockAdminToken,
    company_name: 'Test Company',
    created_at: '2026-03-01T00:00:00Z',
    id: mockProjectId,
    profile_url: 'https://kununu.com/test-company',
    status: 'employer_survey_in_progress',
    updated_at: '2026-03-01T00:00:00Z',
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return 401 when projectId is missing', async () => {
    const request = new NextRequest(
      `http://localhost:3000/api/projects/validate-admin?admin_token=${mockAdminToken}`,
    );

    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error).toBe('missing_project_id');
  });

  it('should return 401 when admin_token is missing', async () => {
    const request = new NextRequest(
      `http://localhost:3000/api/projects/validate-admin?projectId=${mockProjectId}`,
    );

    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error).toBe('missing_admin_token');
  });

  it('should return 401 when token is invalid', async () => {
    const request = new NextRequest(
      `http://localhost:3000/api/projects/validate-admin?projectId=${mockProjectId}&admin_token=wrong-token`,
    );

    (supabase.from as jest.Mock).mockReturnValue({
      eq: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({
        data: null,
        error: {message: 'Not found'},
      }),
    });

    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error).toBe('invalid_credentials');
  });

  it('should return 200 with project data when token is valid (query params)', async () => {
    const request = new NextRequest(
      `http://localhost:3000/api/projects/validate-admin?projectId=${mockProjectId}&admin_token=${mockAdminToken}`,
    );

    (supabase.from as jest.Mock).mockReturnValue({
      eq: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({
        data: mockProjectData,
        error: null,
      }),
    });

    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.valid).toBe(true);
    expect(data.project).toBeDefined();
    expect(data.project.company_name).toBe('Test Company');
    expect(data.project.id).toBe(mockProjectId);
  });

  it('should return 200 with project data when using Authorization header', async () => {
    const request = new NextRequest(
      `http://localhost:3000/api/projects/validate-admin?projectId=${mockProjectId}`,
      {
        headers: {
          authorization: `Bearer ${mockAdminToken}`,
        },
      },
    );

    (supabase.from as jest.Mock).mockReturnValue({
      eq: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({
        data: mockProjectData,
        error: null,
      }),
    });

    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.valid).toBe(true);
    expect(data.project).toBeDefined();
  });

  it('should return 200 with project data when using x-admin-token header', async () => {
    const request = new NextRequest(
      `http://localhost:3000/api/projects/validate-admin?projectId=${mockProjectId}`,
      {
        headers: {
          'x-admin-token': mockAdminToken,
        },
      },
    );

    (supabase.from as jest.Mock).mockReturnValue({
      eq: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({
        data: mockProjectData,
        error: null,
      }),
    });

    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.valid).toBe(true);
    expect(data.project).toBeDefined();
  });
});
