/**
 * @jest-environment node
 */

// Mocks must be before imports
import {NextRequest} from 'next/server';

import {GET} from './route';

import {
  Project,
  ProjectRepository,
  ProjectStatus,
} from '@/lib/repositories/projectRepository';

jest.mock('@/lib/repositories/projectRepository', () => ({
  ProjectRepository: jest.fn().mockImplementation(() => ({
    findByIdAndAdminToken: jest.fn(),
  })),
}));

describe('GET /api/projects/validate-admin', () => {
  const mockProjectId = '123e4567-e89b-12d3-a456-426614174000';
  const mockAdminToken = 'test-admin-token';
  const mockProjectData: Partial<Project> = {
    admin_token: mockAdminToken,
    company_name: 'Test Company',
    created_at: '2026-03-01T00:00:00Z',
    id: mockProjectId,
    profile_url: 'https://kununu.com/test-company',
    status: 'employer_survey_in_progress' as ProjectStatus,
    updated_at: '2026-03-01T00:00:00Z',
  };

  // Helper function to mock the repository with a specific return value
  const mockRepositoryFindByIdAndAdminToken = (
    returnValue: Partial<Project> | null,
  ): jest.Mock => {
    const mockFn = jest.fn().mockResolvedValue(returnValue);

    (
      ProjectRepository as jest.MockedClass<typeof ProjectRepository>
    ).mockImplementation(
      () =>
        ({
          findByIdAndAdminToken: mockFn,
        }) as Partial<ProjectRepository> as ProjectRepository,
    );
    return mockFn;
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

    mockRepositoryFindByIdAndAdminToken(null);

    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error).toBe('invalid_credentials');
  });

  it('should return 200 with project data when token is valid (query params)', async () => {
    const request = new NextRequest(
      `http://localhost:3000/api/projects/validate-admin?projectId=${mockProjectId}&admin_token=${mockAdminToken}`,
    );

    mockRepositoryFindByIdAndAdminToken(mockProjectData);

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

    mockRepositoryFindByIdAndAdminToken(mockProjectData);

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

    mockRepositoryFindByIdAndAdminToken(mockProjectData);

    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.valid).toBe(true);
    expect(data.project).toBeDefined();
  });
});
