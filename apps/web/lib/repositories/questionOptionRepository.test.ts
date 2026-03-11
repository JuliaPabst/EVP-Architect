/**
 * @jest-environment node
 */
import {
  QuestionOptionRepository,
  QuestionOption,
} from './questionOptionRepository';

import {supabase} from '@/lib/supabase';

jest.mock('@/lib/supabase', () => ({
  supabase: {
    from: jest.fn(),
  },
}));

describe('QuestionOptionRepository', () => {
  let repository: QuestionOptionRepository;
  let mockFrom: jest.Mock;
  let mockSelect: jest.Mock;
  let mockIn: jest.Mock;
  let mockOrder: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    repository = new QuestionOptionRepository();

    // Set up the mock chain
    mockOrder = jest.fn();
    mockIn = jest.fn().mockReturnValue({order: mockOrder});
    mockSelect = jest.fn().mockReturnValue({in: mockIn});
    mockFrom = jest.fn();

    (supabase.from as jest.Mock) = mockFrom;
  });

  describe('getOptionsByQuestionKeys', () => {
    it('should return empty map for empty question keys array', async () => {
      const result = await repository.getOptionsByQuestionKeys([]);

      expect(result).toEqual(new Map());
      expect(mockFrom).not.toHaveBeenCalled();
    });

    it('should fetch and organize options by question key', async () => {
      const mockOptions: QuestionOption[] = [
        {
          label_de: 'Technologie',
          position: 0,
          question_key: 'industry',
          value_key: 'tech',
        },
        {
          label_de: 'Gesundheitswesen',
          position: 1,
          question_key: 'industry',
          value_key: 'healthcare',
        },
        {
          label_de: 'Klein',
          position: 0,
          question_key: 'size',
          value_key: 'small',
        },
      ];

      mockOrder.mockResolvedValue({data: mockOptions, error: null});
      mockFrom.mockReturnValue({select: mockSelect});

      const result = await repository.getOptionsByQuestionKeys([
        'industry',
        'size',
      ]);

      expect(mockFrom).toHaveBeenCalledWith('evp_question_options');
      expect(mockSelect).toHaveBeenCalledWith('*');
      expect(mockIn).toHaveBeenCalledWith('question_key', ['industry', 'size']);
      expect(mockOrder).toHaveBeenCalledWith('position', {ascending: true});

      expect(result.get('industry')).toEqual([
        {label: 'Technologie', value_key: 'tech'},
        {label: 'Gesundheitswesen', value_key: 'healthcare'},
      ]);
      expect(result.get('size')).toEqual([
        {label: 'Klein', value_key: 'small'},
      ]);
      expect(result.size).toBe(2);
    });

    it('should handle single question key', async () => {
      const mockOptions: QuestionOption[] = [
        {
          label_de: 'Technologie',
          position: 0,
          question_key: 'industry',
          value_key: 'tech',
        },
      ];

      mockOrder.mockResolvedValue({data: mockOptions, error: null});
      mockFrom.mockReturnValue({select: mockSelect});

      const result = await repository.getOptionsByQuestionKeys(['industry']);

      expect(mockIn).toHaveBeenCalledWith('question_key', ['industry']);
      expect(result.get('industry')).toEqual([
        {label: 'Technologie', value_key: 'tech'},
      ]);
      expect(result.size).toBe(1);
    });

    it('should handle empty data response', async () => {
      mockOrder.mockResolvedValue({data: [], error: null});
      mockFrom.mockReturnValue({select: mockSelect});

      const result = await repository.getOptionsByQuestionKeys(['industry']);

      expect(result).toEqual(new Map());
    });

    it('should handle null data response', async () => {
      mockOrder.mockResolvedValue({data: null, error: null});
      mockFrom.mockReturnValue({select: mockSelect});

      const result = await repository.getOptionsByQuestionKeys(['industry']);

      expect(result).toEqual(new Map());
    });

    it('should preserve option order based on position', async () => {
      const mockOptions: QuestionOption[] = [
        {
          label_de: 'Hoch',
          position: 2,
          question_key: 'priority',
          value_key: 'high',
        },
        {
          label_de: 'Mittel',
          position: 1,
          question_key: 'priority',
          value_key: 'medium',
        },
        {
          label_de: 'Niedrig',
          position: 0,
          question_key: 'priority',
          value_key: 'low',
        },
      ];

      mockOrder.mockResolvedValue({data: mockOptions, error: null});
      mockFrom.mockReturnValue({select: mockSelect});

      const result = await repository.getOptionsByQuestionKeys(['priority']);

      // Verify order is maintained (they come ordered from DB)
      expect(result.get('priority')).toEqual([
        {label: 'Hoch', value_key: 'high'},
        {label: 'Mittel', value_key: 'medium'},
        {label: 'Niedrig', value_key: 'low'},
      ]);
    });

    it('should throw error when database query fails', async () => {
      const mockError = {message: 'Connection timeout'};

      mockOrder.mockResolvedValue({data: null, error: mockError});
      mockFrom.mockReturnValue({select: mockSelect});

      await expect(
        repository.getOptionsByQuestionKeys(['industry']),
      ).rejects.toThrow('Failed to fetch question options: Connection timeout');
    });

    it('should handle multiple options for multiple question keys', async () => {
      const mockOptions: QuestionOption[] = [
        {label_de: 'Label 1', position: 0, question_key: 'q1', value_key: 'v1'},
        {label_de: 'Label 2', position: 1, question_key: 'q1', value_key: 'v2'},
        {label_de: 'Label 3', position: 0, question_key: 'q2', value_key: 'v3'},
        {label_de: 'Label 4', position: 1, question_key: 'q2', value_key: 'v4'},
        {label_de: 'Label 5', position: 0, question_key: 'q3', value_key: 'v5'},
      ];

      mockOrder.mockResolvedValue({data: mockOptions, error: null});
      mockFrom.mockReturnValue({select: mockSelect});

      const result = await repository.getOptionsByQuestionKeys([
        'q1',
        'q2',
        'q3',
      ]);

      expect(result.size).toBe(3);
      expect(result.get('q1')).toHaveLength(2);
      expect(result.get('q2')).toHaveLength(2);
      expect(result.get('q3')).toHaveLength(1);
    });
  });
});
