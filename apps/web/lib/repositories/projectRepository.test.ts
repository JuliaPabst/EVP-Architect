/**
 * @jest-environment node
 */
import {ProjectRepository, Project, ProjectStatus} from './projectRepository';

import {supabase} from '@/lib/supabase';

jest.mock('@/lib/supabase', () => ({
  supabase: {
    from: jest.fn(),
  },
}));

describe('ProjectRepository', () => {
  let repository: ProjectRepository;
  let mockFrom: jest.Mock;
  let mockUpdate: jest.Mock;
  let mockSelect: jest.Mock;
  let mockEq: jest.Mock;
  let mockSingle: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    repository = new ProjectRepository();

    // Set up the mock chain
    mockSingle = jest.fn();
    mockEq = jest.fn();
    mockSelect = jest.fn();
    mockUpdate = jest.fn();
    mockFrom = jest.fn();

    (supabase.from as jest.Mock) = mockFrom;
  });

  describe('updateStatus', () => {
    it('should update project status to employer_survey_in_progress', async () => {
      mockEq.mockResolvedValue({error: null});
      mockUpdate.mockReturnValue({eq: mockEq});
      mockFrom.mockReturnValue({update: mockUpdate});

      await repository.updateStatus('project1', 'employer_survey_in_progress');

      expect(mockFrom).toHaveBeenCalledWith('evp_projects');
      expect(mockUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'employer_survey_in_progress',
          updated_at: expect.any(String),
        }),
      );
      expect(mockEq).toHaveBeenCalledWith('id', 'project1');
    });

    it('should update project status to employer_survey_completed', async () => {
      mockEq.mockResolvedValue({error: null});
      mockUpdate.mockReturnValue({eq: mockEq});
      mockFrom.mockReturnValue({update: mockUpdate});

      await repository.updateStatus('project1', 'employer_survey_completed');

      expect(mockUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'employer_survey_completed',
        }),
      );
    });

    it('should update project status to employee_survey_active', async () => {
      mockEq.mockResolvedValue({error: null});
      mockUpdate.mockReturnValue({eq: mockEq});
      mockFrom.mockReturnValue({update: mockUpdate});

      await repository.updateStatus('project1', 'employee_survey_active');

      expect(mockUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'employee_survey_active',
        }),
      );
    });

    it('should update project status to evp_generation_available', async () => {
      mockEq.mockResolvedValue({error: null});
      mockUpdate.mockReturnValue({eq: mockEq});
      mockFrom.mockReturnValue({update: mockUpdate});

      await repository.updateStatus('project1', 'evp_generation_available');

      expect(mockUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'evp_generation_available',
        }),
      );
    });

    it('should update project status to evp_generated', async () => {
      mockEq.mockResolvedValue({error: null});
      mockUpdate.mockReturnValue({eq: mockEq});
      mockFrom.mockReturnValue({update: mockUpdate});

      await repository.updateStatus('project1', 'evp_generated');

      expect(mockUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'evp_generated',
        }),
      );
    });

    it('should include updated_at timestamp', async () => {
      const beforeTime = Date.now();

      mockEq.mockResolvedValue({error: null});
      mockUpdate.mockReturnValue({eq: mockEq});
      mockFrom.mockReturnValue({update: mockUpdate});

      await repository.updateStatus('project1', 'employer_survey_completed');

      const afterTime = Date.now();
      const updateCall = mockUpdate.mock.calls[0][0];

      expect(updateCall.updated_at).toBeDefined();

      // Parse the ISO string to milliseconds for comparison
      const updatedAtTime = new Date(updateCall.updated_at).getTime();

      expect(updatedAtTime).toBeGreaterThanOrEqual(beforeTime);
      expect(updatedAtTime).toBeLessThanOrEqual(afterTime);
    });

    it('should throw error when update fails', async () => {
      const mockError = {message: 'Project not found'};

      mockEq.mockResolvedValue({error: mockError});
      mockUpdate.mockReturnValue({eq: mockEq});
      mockFrom.mockReturnValue({update: mockUpdate});

      await expect(
        repository.updateStatus('project1', 'employer_survey_completed'),
      ).rejects.toThrow('Failed to update project status: Project not found');
    });
  });

  describe('findById', () => {
    const mockProject: Project = {
      admin_token: 'admin123',
      admin_token_created_at: '2024-01-01',
      company_name: 'Test Company',
      created_at: '2024-01-01',
      employee_count: null,
      id: 'project1',
      industry: null,
      location: null,
      profile_image_url: null,
      profile_url: 'https://kununu.com/test',
      profile_uuid: null,
      status: 'employer_survey_in_progress',
      survey_token: 'survey123',
      survey_token_created_at: '2024-01-01',
      updated_at: '2024-01-01',
    };

    it('should fetch project by ID', async () => {
      mockSingle.mockResolvedValue({data: mockProject, error: null});
      mockEq.mockReturnValue({single: mockSingle});
      mockSelect.mockReturnValue({eq: mockEq});
      mockFrom.mockReturnValue({select: mockSelect});

      const result = await repository.findById('project1');

      expect(mockFrom).toHaveBeenCalledWith('evp_projects');
      expect(mockSelect).toHaveBeenCalledWith('*');
      expect(mockEq).toHaveBeenCalledWith('id', 'project1');
      expect(mockSingle).toHaveBeenCalled();
      expect(result).toEqual(mockProject);
    });

    it('should return null when project not found (PGRST116)', async () => {
      const mockError = {code: 'PGRST116', message: 'No rows found'};

      mockSingle.mockResolvedValue({data: null, error: mockError});
      mockEq.mockReturnValue({single: mockSingle});
      mockSelect.mockReturnValue({eq: mockEq});
      mockFrom.mockReturnValue({select: mockSelect});

      const result = await repository.findById('nonexistent');

      expect(result).toBeNull();
    });

    it('should throw error for other database errors', async () => {
      const mockError = {code: 'PGRST999', message: 'Database error'};

      mockSingle.mockResolvedValue({data: null, error: mockError});
      mockEq.mockReturnValue({single: mockSingle});
      mockSelect.mockReturnValue({eq: mockEq});
      mockFrom.mockReturnValue({select: mockSelect});

      await expect(repository.findById('project1')).rejects.toThrow(
        'Failed to fetch project: Database error',
      );
    });

    it('should fetch project with all optional fields populated', async () => {
      const fullProject: Project = {
        ...mockProject,
        employee_count: '100-500',
        industry: 5,
        location: 'Munich',
        profile_image_url: 'https://img.kununu.com/test.jpg',
        profile_uuid: 'uuid123',
      };

      mockSingle.mockResolvedValue({data: fullProject, error: null});
      mockEq.mockReturnValue({single: mockSingle});
      mockSelect.mockReturnValue({eq: mockEq});
      mockFrom.mockReturnValue({select: mockSelect});

      const result = await repository.findById('project1');

      expect(result).toEqual(fullProject);
      expect(result?.profile_uuid).toBe('uuid123');
      expect(result?.profile_image_url).toBe('https://img.kununu.com/test.jpg');
      expect(result?.industry).toBe(5);
      expect(result?.employee_count).toBe('100-500');
      expect(result?.location).toBe('Munich');
    });

    it.each<ProjectStatus>([
      'employer_survey_in_progress',
      'employer_survey_completed',
      'employee_survey_active',
      'evp_generation_available',
      'evp_generated',
    ])('should fetch project with status: %s', async status => {
      const projectWithStatus = {...mockProject, status};

      mockSingle.mockResolvedValue({data: projectWithStatus, error: null});
      mockEq.mockReturnValue({single: mockSingle});
      mockSelect.mockReturnValue({eq: mockEq});
      mockFrom.mockReturnValue({select: mockSelect});

      const result = await repository.findById('project1');

      expect(result?.status).toBe(status);
    });
  });

  describe('findByIdAndAdminToken', () => {
    const mockProject: Project = {
      admin_token: 'admin123',
      admin_token_created_at: '2024-01-01',
      company_name: 'Test Company',
      created_at: '2024-01-01',
      employee_count: null,
      id: 'project1',
      industry: null,
      location: null,
      profile_image_url: null,
      profile_url: 'https://kununu.com/test',
      profile_uuid: null,
      status: 'employer_survey_in_progress',
      survey_token: 'survey123',
      survey_token_created_at: '2024-01-01',
      updated_at: '2024-01-01',
    };

    it('should fetch project by ID and admin token', async () => {
      mockSingle.mockResolvedValue({data: mockProject, error: null});
      mockEq.mockReturnValue({single: mockSingle});
      mockEq.mockReturnValueOnce({eq: mockEq});
      mockSelect.mockReturnValue({eq: mockEq});
      mockFrom.mockReturnValue({select: mockSelect});

      const result = await repository.findByIdAndAdminToken(
        'project1',
        'admin123',
      );

      expect(mockFrom).toHaveBeenCalledWith('evp_projects');
      expect(mockSelect).toHaveBeenCalledWith('*');
      expect(mockEq).toHaveBeenCalledWith('id', 'project1');
      expect(mockEq).toHaveBeenCalledWith('admin_token', 'admin123');
      expect(mockSingle).toHaveBeenCalled();
      expect(result).toEqual(mockProject);
    });

    it('should return null when project not found (PGRST116)', async () => {
      const mockError = {code: 'PGRST116', message: 'No rows found'};

      mockSingle.mockResolvedValue({data: null, error: mockError});
      mockEq.mockReturnValue({single: mockSingle});
      mockEq.mockReturnValueOnce({eq: mockEq});
      mockSelect.mockReturnValue({eq: mockEq});
      mockFrom.mockReturnValue({select: mockSelect});

      const result = await repository.findByIdAndAdminToken(
        'project1',
        'wrong-token',
      );

      expect(result).toBeNull();
    });

    it('should return null when admin token does not match', async () => {
      const mockError = {code: 'PGRST116', message: 'No rows found'};

      mockSingle.mockResolvedValue({data: null, error: mockError});
      mockEq.mockReturnValue({single: mockSingle});
      mockEq.mockReturnValueOnce({eq: mockEq});
      mockSelect.mockReturnValue({eq: mockEq});
      mockFrom.mockReturnValue({select: mockSelect});

      const result = await repository.findByIdAndAdminToken(
        'project1',
        'invalid-token',
      );

      expect(result).toBeNull();
    });

    it('should throw error for other database errors', async () => {
      const mockError = {code: 'PGRST999', message: 'Database error'};

      mockSingle.mockResolvedValue({data: null, error: mockError});
      mockEq.mockReturnValue({single: mockSingle});
      mockEq.mockReturnValueOnce({eq: mockEq});
      mockSelect.mockReturnValue({eq: mockEq});
      mockFrom.mockReturnValue({select: mockSelect});

      await expect(
        repository.findByIdAndAdminToken('project1', 'admin123'),
      ).rejects.toThrow('Failed to validate project access: Database error');
    });

    it('should fetch project with all fields populated', async () => {
      const fullProject: Project = {
        ...mockProject,
        employee_count: '100-500',
        industry: 5,
        location: 'Munich',
        profile_image_url: 'https://img.kununu.com/test.jpg',
        profile_uuid: 'uuid123',
      };

      mockSingle.mockResolvedValue({data: fullProject, error: null});
      mockEq.mockReturnValue({single: mockSingle});
      mockEq.mockReturnValueOnce({eq: mockEq});
      mockSelect.mockReturnValue({eq: mockEq});
      mockFrom.mockReturnValue({select: mockSelect});

      const result = await repository.findByIdAndAdminToken(
        'project1',
        'admin123',
      );

      expect(result).toEqual(fullProject);
      expect(result?.admin_token).toBe('admin123');
      expect(result?.profile_uuid).toBe('uuid123');
      expect(result?.industry).toBe(5);
    });

    it('should validate both ID and token must match', async () => {
      // When either ID or token is wrong, no rows should be returned
      const mockError = {code: 'PGRST116', message: 'No rows found'};

      mockSingle.mockResolvedValue({data: null, error: mockError});
      mockEq.mockReturnValue({single: mockSingle});
      mockEq.mockReturnValueOnce({eq: mockEq});
      mockSelect.mockReturnValue({eq: mockEq});
      mockFrom.mockReturnValue({select: mockSelect});

      const result = await repository.findByIdAndAdminToken(
        'wrong-id',
        'admin123',
      );

      expect(result).toBeNull();
    });
  });
});
