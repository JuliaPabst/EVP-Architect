/**
 * @jest-environment node
 */
import {SurveyQuestionRepository} from './surveyQuestionRepository';

import {supabase} from '@/lib/supabase';
import {SurveyQuestion} from '@/lib/types/survey';

jest.mock('@/lib/supabase', () => ({
  supabase: {
    from: jest.fn(),
  },
}));

describe('SurveyQuestionRepository', () => {
  let repository: SurveyQuestionRepository;
  let mockFrom: jest.Mock;
  let mockSelect: jest.Mock;
  let mockEq: jest.Mock;
  let mockIn: jest.Mock;
  let mockOrder: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    repository = new SurveyQuestionRepository();

    // Set up the mock chain
    mockOrder = jest.fn();
    mockEq = jest.fn().mockReturnValue({order: mockOrder});
    mockIn = jest.fn();
    mockSelect = jest.fn();
    mockFrom = jest.fn();

    (supabase.from as jest.Mock) = mockFrom;
  });

  describe('getQuestionsByStep', () => {
    it('should fetch questions for a specific survey type and step', async () => {
      const mockQuestions: SurveyQuestion[] = [
        {
          created_at: '2024-01-01T00:00:00Z',
          help_text: null,
          id: 'q1',
          key: 'company_values',
          position: 1,
          prompt: 'What are your values?',
          question_type: 'long_text',
          selection_limit: null,
          step: 2,
          survey_type: 'employer',
        },
        {
          created_at: '2024-01-01T00:00:00Z',
          help_text: null,
          id: 'q2',
          key: 'industry',
          position: 2,
          prompt: 'What is your industry?',
          question_type: 'single_select',
          selection_limit: null,
          step: 2,
          survey_type: 'employer',
        },
      ];

      mockOrder.mockResolvedValue({data: mockQuestions, error: null});
      mockEq.mockReturnValue({eq: mockEq, order: mockOrder});
      mockSelect.mockReturnValue({eq: mockEq});
      mockFrom.mockReturnValue({select: mockSelect});

      const result = await repository.getQuestionsByStep('employer', 2);

      expect(mockFrom).toHaveBeenCalledWith('evp_survey_questions');
      expect(mockSelect).toHaveBeenCalledWith('*');
      expect(mockEq).toHaveBeenCalledWith('survey_type', 'employer');
      expect(mockEq).toHaveBeenCalledWith('step', 2);
      expect(mockOrder).toHaveBeenCalledWith('position', {ascending: true});
      expect(result).toEqual(mockQuestions);
    });

    it('should return empty array when no questions found', async () => {
      mockOrder.mockResolvedValue({data: [], error: null});
      mockEq.mockReturnValue({eq: mockEq, order: mockOrder});
      mockSelect.mockReturnValue({eq: mockEq});
      mockFrom.mockReturnValue({select: mockSelect});

      const result = await repository.getQuestionsByStep('employee', 3);

      expect(result).toEqual([]);
    });

    it('should handle null data response', async () => {
      mockOrder.mockResolvedValue({data: null, error: null});
      mockEq.mockReturnValue({eq: mockEq, order: mockOrder});
      mockSelect.mockReturnValue({eq: mockEq});
      mockFrom.mockReturnValue({select: mockSelect});

      const result = await repository.getQuestionsByStep('employer', 1);

      expect(result).toEqual([]);
    });

    it('should throw error when database query fails', async () => {
      const mockError = {message: 'Connection timeout'};

      mockOrder.mockResolvedValue({data: null, error: mockError});
      mockEq.mockReturnValue({eq: mockEq, order: mockOrder});
      mockSelect.mockReturnValue({eq: mockEq});
      mockFrom.mockReturnValue({select: mockSelect});

      await expect(
        repository.getQuestionsByStep('employer', 2),
      ).rejects.toThrow('Failed to fetch survey questions: Connection timeout');
    });
  });

  describe('getQuestionsByIds', () => {
    it('should return empty map for empty question IDs array', async () => {
      const result = await repository.getQuestionsByIds([]);

      expect(result).toEqual(new Map());
      expect(mockFrom).not.toHaveBeenCalled();
    });

    it('should fetch and organize questions by ID', async () => {
      const mockQuestions: SurveyQuestion[] = [
        {
          created_at: '2024-01-01T00:00:00Z',
          help_text: null,
          id: 'q1',
          key: 'company_values',
          position: 1,
          prompt: 'What are your values?',
          question_type: 'long_text',
          selection_limit: null,
          step: 2,
          survey_type: 'employer',
        },
        {
          created_at: '2024-01-01T00:00:00Z',
          help_text: null,
          id: 'q2',
          key: 'industry',
          position: 2,
          prompt: 'What is your industry?',
          question_type: 'single_select',
          selection_limit: null,
          step: 2,
          survey_type: 'employer',
        },
      ];

      mockIn.mockResolvedValue({data: mockQuestions, error: null});
      mockSelect.mockReturnValue({in: mockIn});
      mockFrom.mockReturnValue({select: mockSelect});

      const result = await repository.getQuestionsByIds(['q1', 'q2']);

      expect(mockFrom).toHaveBeenCalledWith('evp_survey_questions');
      expect(mockSelect).toHaveBeenCalledWith('*');
      expect(mockIn).toHaveBeenCalledWith('id', ['q1', 'q2']);

      expect(result.get('q1')).toEqual(mockQuestions[0]);
      expect(result.get('q2')).toEqual(mockQuestions[1]);
      expect(result.size).toBe(2);
    });

    it('should handle empty data response', async () => {
      mockIn.mockResolvedValue({data: [], error: null});
      mockSelect.mockReturnValue({in: mockIn});
      mockFrom.mockReturnValue({select: mockSelect});

      const result = await repository.getQuestionsByIds(['q1']);

      expect(result).toEqual(new Map());
    });

    it('should handle null data response', async () => {
      mockIn.mockResolvedValue({data: null, error: null});
      mockSelect.mockReturnValue({in: mockIn});
      mockFrom.mockReturnValue({select: mockSelect});

      const result = await repository.getQuestionsByIds(['q1']);

      expect(result).toEqual(new Map());
    });

    it('should throw error when database query fails', async () => {
      const mockError = {message: 'Query execution failed'};

      mockIn.mockResolvedValue({data: null, error: mockError});
      mockSelect.mockReturnValue({in: mockIn});
      mockFrom.mockReturnValue({select: mockSelect});

      await expect(repository.getQuestionsByIds(['q1'])).rejects.toThrow(
        'Failed to fetch questions by IDs: Query execution failed',
      );
    });
  });

  describe('getAllQuestionIds', () => {
    it('should fetch all question IDs for employer survey', async () => {
      const mockData = [{id: 'q1'}, {id: 'q2'}, {id: 'q3'}];

      mockEq.mockResolvedValue({data: mockData, error: null});
      mockSelect.mockReturnValue({eq: mockEq});
      mockFrom.mockReturnValue({select: mockSelect});

      const result = await repository.getAllQuestionIds('employer');

      expect(mockFrom).toHaveBeenCalledWith('evp_survey_questions');
      expect(mockSelect).toHaveBeenCalledWith('id');
      expect(mockEq).toHaveBeenCalledWith('survey_type', 'employer');
      expect(result).toEqual(['q1', 'q2', 'q3']);
    });

    it('should fetch all question IDs for employee survey', async () => {
      const mockData = [{id: 'e1'}, {id: 'e2'}];

      mockEq.mockResolvedValue({data: mockData, error: null});
      mockSelect.mockReturnValue({eq: mockEq});
      mockFrom.mockReturnValue({select: mockSelect});

      const result = await repository.getAllQuestionIds('employee');

      expect(mockEq).toHaveBeenCalledWith('survey_type', 'employee');
      expect(result).toEqual(['e1', 'e2']);
    });

    it('should return empty array when no questions found', async () => {
      mockEq.mockResolvedValue({data: [], error: null});
      mockSelect.mockReturnValue({eq: mockEq});
      mockFrom.mockReturnValue({select: mockSelect});

      const result = await repository.getAllQuestionIds('employer');

      expect(result).toEqual([]);
    });

    it('should handle null data response', async () => {
      mockEq.mockResolvedValue({data: null, error: null});
      mockSelect.mockReturnValue({eq: mockEq});
      mockFrom.mockReturnValue({select: mockSelect});

      const result = await repository.getAllQuestionIds('employer');

      expect(result).toEqual([]);
    });

    it('should throw error when database query fails', async () => {
      const mockError = {message: 'Network error'};

      mockEq.mockResolvedValue({data: null, error: mockError});
      mockSelect.mockReturnValue({eq: mockEq});
      mockFrom.mockReturnValue({select: mockSelect});

      await expect(repository.getAllQuestionIds('employer')).rejects.toThrow(
        'Failed to fetch question IDs for employer: Network error',
      );
    });
  });
});
