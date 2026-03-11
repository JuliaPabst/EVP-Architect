/**
 * @jest-environment node
 */
import {SurveySubmissionRepository} from './surveySubmissionRepository';

import {supabase} from '@/lib/supabase';
import {SurveySubmission} from '@/lib/types/survey';

jest.mock('@/lib/supabase', () => ({
  supabase: {
    from: jest.fn(),
  },
}));

describe('SurveySubmissionRepository', () => {
  let repository: SurveySubmissionRepository;
  let mockFrom: jest.Mock;
  let mockSelect: jest.Mock;
  let mockEq: jest.Mock;
  let mockSingle: jest.Mock;
  let mockInsert: jest.Mock;
  let mockUpdate: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    repository = new SurveySubmissionRepository();

    // Set up the mock chain
    mockSingle = jest.fn();
    mockEq = jest.fn();
    mockUpdate = jest.fn();
    mockInsert = jest.fn();
    mockSelect = jest.fn();
    mockFrom = jest.fn();

    (supabase.from as jest.Mock) = mockFrom;
  });

  describe('findSubmission', () => {
    const mockSubmission: SurveySubmission = {
      created_at: '2024-01-01',
      id: 'submission1',
      project_id: 'project1',
      respondent_meta: {},
      status: 'in_progress',
      submitted_at: null,
      survey_type: 'employer',
      updated_at: '2024-01-01',
    };

    it('should find an existing submission', async () => {
      mockSingle.mockResolvedValue({data: mockSubmission, error: null});
      mockEq.mockReturnValue({eq: mockEq, single: mockSingle});
      mockSelect.mockReturnValue({eq: mockEq});
      mockFrom.mockReturnValue({select: mockSelect});

      const result = await repository.findSubmission('project1', 'employer');

      expect(mockFrom).toHaveBeenCalledWith('evp_survey_submissions');
      expect(mockSelect).toHaveBeenCalledWith('*');
      expect(mockEq).toHaveBeenCalledWith('project_id', 'project1');
      expect(mockEq).toHaveBeenCalledWith('survey_type', 'employer');
      expect(mockSingle).toHaveBeenCalled();
      expect(result).toEqual(mockSubmission);
    });

    it('should return null when no submission found (PGRST116)', async () => {
      const mockError = {code: 'PGRST116', message: 'No rows found'};

      mockSingle.mockResolvedValue({data: null, error: mockError});
      mockEq.mockReturnValue({eq: mockEq, single: mockSingle});
      mockSelect.mockReturnValue({eq: mockEq});
      mockFrom.mockReturnValue({select: mockSelect});

      const result = await repository.findSubmission('project1', 'employer');

      expect(result).toBeNull();
    });

    it('should throw error for other database errors', async () => {
      const mockError = {code: 'PGRST999', message: 'Database error'};

      mockSingle.mockResolvedValue({data: null, error: mockError});
      mockEq.mockReturnValue({eq: mockEq, single: mockSingle});
      mockSelect.mockReturnValue({eq: mockEq});
      mockFrom.mockReturnValue({select: mockSelect});

      await expect(
        repository.findSubmission('project1', 'employer'),
      ).rejects.toThrow('Failed to fetch submission: Database error');
    });

    it('should find employee survey submission', async () => {
      const employeeSubmission = {
        ...mockSubmission,
        survey_type: 'employee' as const,
      };

      mockSingle.mockResolvedValue({data: employeeSubmission, error: null});
      mockEq.mockReturnValue({eq: mockEq, single: mockSingle});
      mockSelect.mockReturnValue({eq: mockEq});
      mockFrom.mockReturnValue({select: mockSelect});

      const result = await repository.findSubmission('project1', 'employee');

      expect(mockEq).toHaveBeenCalledWith('survey_type', 'employee');
      expect(result).toEqual(employeeSubmission);
    });
  });

  describe('createSubmission', () => {
    it('should create a new employer submission', async () => {
      const mockSubmission: SurveySubmission = {
        created_at: '2024-01-01',
        id: 'new-submission',
        project_id: 'project1',
        respondent_meta: {},
        status: 'in_progress',
        submitted_at: null,
        survey_type: 'employer',
        updated_at: '2024-01-01',
      };

      mockSingle.mockResolvedValue({data: mockSubmission, error: null});
      mockSelect.mockReturnValue({single: mockSingle});
      mockInsert.mockReturnValue({select: mockSelect});
      mockFrom.mockReturnValue({insert: mockInsert});

      const result = await repository.createSubmission('project1', 'employer');

      expect(mockFrom).toHaveBeenCalledWith('evp_survey_submissions');
      expect(mockInsert).toHaveBeenCalledWith({
        project_id: 'project1',
        respondent_meta: {},
        status: 'in_progress',
        survey_type: 'employer',
      });
      expect(mockSelect).toHaveBeenCalled();
      expect(mockSingle).toHaveBeenCalled();
      expect(result).toEqual(mockSubmission);
    });

    it('should create a new employee submission', async () => {
      const mockSubmission: SurveySubmission = {
        created_at: '2024-01-01',
        id: 'new-submission',
        project_id: 'project1',
        respondent_meta: {},
        status: 'in_progress',
        submitted_at: null,
        survey_type: 'employee',
        updated_at: '2024-01-01',
      };

      mockSingle.mockResolvedValue({data: mockSubmission, error: null});
      mockSelect.mockReturnValue({single: mockSingle});
      mockInsert.mockReturnValue({select: mockSelect});
      mockFrom.mockReturnValue({insert: mockInsert});

      const result = await repository.createSubmission('project1', 'employee');

      expect(mockInsert).toHaveBeenCalledWith({
        project_id: 'project1',
        respondent_meta: {},
        status: 'in_progress',
        survey_type: 'employee',
      });
      expect(result.survey_type).toBe('employee');
    });

    it('should throw error when creation fails', async () => {
      const mockError = {message: 'Foreign key constraint failed'};

      mockSingle.mockResolvedValue({data: null, error: mockError});
      mockSelect.mockReturnValue({single: mockSingle});
      mockInsert.mockReturnValue({select: mockSelect});
      mockFrom.mockReturnValue({insert: mockInsert});

      await expect(
        repository.createSubmission('project1', 'employer'),
      ).rejects.toThrow(
        'Failed to create submission: Foreign key constraint failed',
      );
    });
  });

  describe('getOrCreateEmployerSubmission', () => {
    const mockSubmission: SurveySubmission = {
      created_at: '2024-01-01',
      id: 'submission1',
      project_id: 'project1',
      respondent_meta: {},
      status: 'in_progress',
      submitted_at: null,
      survey_type: 'employer',
      updated_at: '2024-01-01',
    };

    it('should return existing employer submission', async () => {
      // Mock findSubmission to return existing submission
      mockSingle.mockResolvedValue({data: mockSubmission, error: null});
      mockEq.mockReturnValue({eq: mockEq, single: mockSingle});
      mockSelect.mockReturnValue({eq: mockEq});
      mockFrom.mockReturnValue({select: mockSelect});

      const result = await repository.getOrCreateEmployerSubmission('project1');

      expect(result).toEqual(mockSubmission);
      // Only select should be called (from findSubmission)
      expect(mockInsert).not.toHaveBeenCalled();
    });

    it('should create new employer submission when none exists', async () => {
      // First call (findSubmission) returns PGRST116 error
      const noRowsError = {code: 'PGRST116', message: 'No rows found'};

      // Second call (createSubmission) returns new submission
      const newSubmission = {...mockSubmission, id: 'new-submission'};

      mockSingle
        .mockResolvedValueOnce({data: null, error: noRowsError})
        .mockResolvedValueOnce({data: newSubmission, error: null});

      mockEq.mockReturnValue({eq: mockEq, single: mockSingle});
      mockSelect.mockReturnValue({eq: mockEq, single: mockSingle});
      mockInsert.mockReturnValue({select: mockSelect});
      mockFrom.mockReturnValue({insert: mockInsert, select: mockSelect});

      const result = await repository.getOrCreateEmployerSubmission('project1');

      expect(result).toEqual(newSubmission);
      expect(mockInsert).toHaveBeenCalled();
    });
  });

  describe('markAsSubmitted', () => {
    it('should mark submission as submitted', async () => {
      mockEq.mockResolvedValue({error: null});
      mockUpdate.mockReturnValue({eq: mockEq});
      mockFrom.mockReturnValue({update: mockUpdate});

      await repository.markAsSubmitted('submission1');

      expect(mockFrom).toHaveBeenCalledWith('evp_survey_submissions');
      expect(mockUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'submitted',
        }),
      );
      expect(mockUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          submitted_at: expect.any(String),
        }),
      );
      expect(mockEq).toHaveBeenCalledWith('id', 'submission1');
    });

    it('should throw error when update fails', async () => {
      const mockError = {message: 'Update failed'};

      mockEq.mockResolvedValue({error: mockError});
      mockUpdate.mockReturnValue({eq: mockEq});
      mockFrom.mockReturnValue({update: mockUpdate});

      await expect(repository.markAsSubmitted('submission1')).rejects.toThrow(
        'Failed to mark submission as submitted: Update failed',
      );
    });
  });
});
