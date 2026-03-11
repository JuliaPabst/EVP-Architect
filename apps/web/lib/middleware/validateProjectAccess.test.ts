/**
 * @jest-environment node
 */
import {NextRequest} from 'next/server';

import {validateProjectAccess} from './validateProjectAccess';

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

describe('validateProjectAccess', () => {
  const mockProjectData: Partial<Project> = {
    admin_token: 'valid-admin-token',
    admin_token_created_at: '2026-03-01T00:00:00Z',
    company_name: 'Test Company',
    created_at: '2026-03-01T00:00:00Z',
    employee_count: '50-100',
    id: 'project-123',
    industry: 1,
    location: 'Berlin',
    profile_image_url: 'https://example.com/image.png',
    profile_url: 'https://kununu.com/test-company',
    profile_uuid: 'profile-uuid-123',
    status: 'employer_survey_in_progress' as ProjectStatus,
    survey_token: 'survey-token-123',
    survey_token_created_at: '2026-03-01T00:00:00Z',
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

  describe('successful validation', () => {
    it('should validate with admin_token in query params', async () => {
      const request = new NextRequest(
        'http://localhost:3000/api/test?projectId=project-123&admin_token=valid-admin-token',
      );

      const mockFn = mockRepositoryFindByIdAndAdminToken(mockProjectData);

      const result = await validateProjectAccess(request);

      expect(result.success).toBe(true);
      expect(result.project).toBeDefined();
      expect(result.project?.id).toBe('project-123');
      expect(result.project?.company_name).toBe('Test Company');
      expect(result.error).toBeUndefined();
      expect(mockFn).toHaveBeenCalledWith('project-123', 'valid-admin-token');
    });

    it('should validate with admin_token in Authorization Bearer header', async () => {
      const request = new NextRequest(
        'http://localhost:3000/api/test?projectId=project-123',
        {
          headers: {
            authorization: 'Bearer valid-admin-token',
          },
        },
      );

      const mockFn = mockRepositoryFindByIdAndAdminToken(mockProjectData);

      const result = await validateProjectAccess(request);

      expect(result.success).toBe(true);
      expect(result.project).toBeDefined();
      expect(result.project?.id).toBe('project-123');
      expect(mockFn).toHaveBeenCalledWith('project-123', 'valid-admin-token');
    });

    it('should validate with admin_token in x-admin-token header', async () => {
      const request = new NextRequest(
        'http://localhost:3000/api/test?projectId=project-123',
        {
          headers: {
            'x-admin-token': 'valid-admin-token',
          },
        },
      );

      const mockFn = mockRepositoryFindByIdAndAdminToken(mockProjectData);

      const result = await validateProjectAccess(request);

      expect(result.success).toBe(true);
      expect(result.project).toBeDefined();
      expect(mockFn).toHaveBeenCalledWith('project-123', 'valid-admin-token');
    });

    it('should prioritize query param over headers', async () => {
      const request = new NextRequest(
        'http://localhost:3000/api/test?projectId=project-123&admin_token=query-token',
        {
          headers: {
            authorization: 'Bearer header-token',
            'x-admin-token': 'x-header-token',
          },
        },
      );

      const mockFn = mockRepositoryFindByIdAndAdminToken(mockProjectData);

      await validateProjectAccess(request);

      // Verify the repository method was called with the token from query params
      expect(mockFn).toHaveBeenCalledWith('project-123', 'query-token');
    });
  });

  describe('missing parameters', () => {
    it('should return 401 if projectId is missing', async () => {
      const request = new NextRequest(
        'http://localhost:3000/api/test?admin_token=valid-admin-token',
      );

      const result = await validateProjectAccess(request);

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      expect(result.project).toBeUndefined();

      const json = await result.error?.json();

      expect(json.error).toBe('missing_project_id');
    });

    it('should return 401 if admin_token is missing from all sources', async () => {
      const request = new NextRequest(
        'http://localhost:3000/api/test?projectId=project-123',
      );

      const result = await validateProjectAccess(request);

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      expect(result.project).toBeUndefined();

      const json = await result.error?.json();

      expect(json.error).toBe('missing_admin_token');
    });
  });

  describe('invalid credentials', () => {
    it('should return 401 if project does not exist', async () => {
      const request = new NextRequest(
        'http://localhost:3000/api/test?projectId=invalid-id&admin_token=valid-admin-token',
      );

      mockRepositoryFindByIdAndAdminToken(null);

      const result = await validateProjectAccess(request);

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      expect(result.project).toBeUndefined();

      const json = await result.error?.json();

      expect(json.error).toBe('invalid_credentials');
    });

    it('should return 401 if admin_token does not match', async () => {
      const request = new NextRequest(
        'http://localhost:3000/api/test?projectId=project-123&admin_token=wrong-token',
      );

      mockRepositoryFindByIdAndAdminToken(null);

      const result = await validateProjectAccess(request);

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();

      const json = await result.error?.json();

      expect(json.error).toBe('invalid_credentials');
    });
  });

  describe('error handling', () => {
    it('should return 401 on database error', async () => {
      const request = new NextRequest(
        'http://localhost:3000/api/test?projectId=project-123&admin_token=valid-admin-token',
      );

      const mockFn = jest.fn().mockRejectedValue(new Error('Database error'));

      (
        ProjectRepository as jest.MockedClass<typeof ProjectRepository>
      ).mockImplementation(
        () =>
          ({
            findByIdAndAdminToken: mockFn,
          }) as Partial<ProjectRepository> as ProjectRepository,
      );

      const result = await validateProjectAccess(request);

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();

      const json = await result.error?.json();

      expect(json.error).toBe('validation_failed');
    });
  });

  describe('project context', () => {
    it('should return complete project context on successful validation', async () => {
      const request = new NextRequest(
        'http://localhost:3000/api/test?projectId=project-123&admin_token=valid-admin-token',
      );

      mockRepositoryFindByIdAndAdminToken(mockProjectData);

      const result = await validateProjectAccess(request);

      expect(result.success).toBe(true);
      expect(result.project).toMatchObject({
        admin_token: 'valid-admin-token',
        company_name: 'Test Company',
        created_at: '2026-03-01T00:00:00Z',
        employee_count: '50-100',
        id: 'project-123',
        industry: 1,
        location: 'Berlin',
        profile_image_url: 'https://example.com/image.png',
        profile_url: 'https://kununu.com/test-company',
        profile_uuid: 'profile-uuid-123',
        status: 'employer_survey_in_progress',
        updated_at: '2026-03-01T00:00:00Z',
      });
    });

    it('should include optional fields when present', async () => {
      const request = new NextRequest(
        'http://localhost:3000/api/test?projectId=project-123&admin_token=valid-admin-token',
      );

      const dataWithOptionals = {
        ...mockProjectData,
        employee_count: '100-500',
        industry: 5,
        location: 'Munich',
      };

      mockRepositoryFindByIdAndAdminToken(dataWithOptionals);

      const result = await validateProjectAccess(request);

      expect(result.project?.employee_count).toBe('100-500');
      expect(result.project?.industry).toBe(5);
      expect(result.project?.location).toBe('Munich');
    });
  });
});
