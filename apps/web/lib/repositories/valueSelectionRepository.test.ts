/**
 * @jest-environment node
 */
import {ValueSelectionRepository} from './valueSelectionRepository';

import {supabase} from '@/lib/supabase';

jest.mock('@/lib/supabase', () => ({
  supabase: {
    from: jest.fn(),
  },
}));

describe('ValueSelectionRepository', () => {
  let repository: ValueSelectionRepository;
  let mockFrom: jest.Mock;
  let mockSelect: jest.Mock;
  let mockDelete: jest.Mock;
  let mockInsert: jest.Mock;
  let mockIn: jest.Mock;
  let mockEq: jest.Mock;
  let mockOrder: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    repository = new ValueSelectionRepository();

    // Set up the mock chain
    mockOrder = jest.fn();
    mockIn = jest.fn().mockReturnValue({order: mockOrder});
    mockSelect = jest.fn().mockReturnValue({in: mockIn});
    mockEq = jest.fn();
    mockDelete = jest.fn().mockReturnValue({eq: mockEq});
    mockInsert = jest.fn();
    mockFrom = jest.fn();

    (supabase.from as jest.Mock) = mockFrom;
  });

  describe('getSelectionsByAnswers', () => {
    it('should return empty map for empty answer IDs array', async () => {
      const result = await repository.getSelectionsByAnswers([]);

      expect(result).toEqual(new Map());
      expect(mockFrom).not.toHaveBeenCalled();
    });

    it('should fetch and organize value selections by answer ID', async () => {
      const mockData = [
        {answer_id: 'answer1', option_key: 'value1', position: 0},
        {answer_id: 'answer1', option_key: 'value2', position: 1},
        {answer_id: 'answer2', option_key: 'value3', position: 0},
      ];

      mockOrder.mockResolvedValue({data: mockData, error: null});
      mockFrom.mockReturnValue({select: mockSelect});

      const result = await repository.getSelectionsByAnswers([
        'answer1',
        'answer2',
      ]);

      expect(mockFrom).toHaveBeenCalledWith('evp_answer_selections');
      expect(mockSelect).toHaveBeenCalledWith('*');
      expect(mockIn).toHaveBeenCalledWith('answer_id', ['answer1', 'answer2']);
      expect(mockOrder).toHaveBeenCalledWith('position', {ascending: true});

      expect(result.get('answer1')).toEqual(['value1', 'value2']);
      expect(result.get('answer2')).toEqual(['value3']);
      expect(result.size).toBe(2);
    });

    it('should handle empty data response', async () => {
      mockOrder.mockResolvedValue({data: [], error: null});
      mockFrom.mockReturnValue({select: mockSelect});

      const result = await repository.getSelectionsByAnswers(['answer1']);

      expect(result).toEqual(new Map());
    });

    it('should handle null data response', async () => {
      mockOrder.mockResolvedValue({data: null, error: null});
      mockFrom.mockReturnValue({select: mockSelect});

      const result = await repository.getSelectionsByAnswers(['answer1']);

      expect(result).toEqual(new Map());
    });

    it('should throw error when database query fails', async () => {
      const mockError = {message: 'Database connection error'};

      mockOrder.mockResolvedValue({data: null, error: mockError});
      mockFrom.mockReturnValue({select: mockSelect});

      await expect(
        repository.getSelectionsByAnswers(['answer1']),
      ).rejects.toThrow(
        'Failed to fetch value selections: Database connection error',
      );
    });
  });

  describe('deleteSelectionsByAnswer', () => {
    it('should delete all selections for an answer', async () => {
      mockEq.mockResolvedValue({error: null});
      mockFrom.mockReturnValue({delete: mockDelete});

      await repository.deleteSelectionsByAnswer('answer123');

      expect(mockFrom).toHaveBeenCalledWith('evp_answer_selections');
      expect(mockDelete).toHaveBeenCalled();
      expect(mockEq).toHaveBeenCalledWith('answer_id', 'answer123');
    });

    it('should throw error when delete fails', async () => {
      const mockError = {message: 'Delete failed'};

      mockEq.mockResolvedValue({error: mockError});
      mockFrom.mockReturnValue({delete: mockDelete});

      await expect(
        repository.deleteSelectionsByAnswer('answer123'),
      ).rejects.toThrow('Failed to delete value selections: Delete failed');
    });
  });

  describe('insertSelections', () => {
    it('should return early for empty value keys array', async () => {
      await repository.insertSelections('answer123', []);

      expect(mockFrom).not.toHaveBeenCalled();
    });

    it('should insert value selections with positions', async () => {
      mockInsert.mockResolvedValue({error: null});
      mockFrom.mockReturnValue({insert: mockInsert});

      await repository.insertSelections('answer123', [
        'value1',
        'value2',
        'value3',
      ]);

      expect(mockFrom).toHaveBeenCalledWith('evp_answer_selections');
      expect(mockInsert).toHaveBeenCalledWith([
        {answer_id: 'answer123', option_key: 'value1', position: 0},
        {answer_id: 'answer123', option_key: 'value2', position: 1},
        {answer_id: 'answer123', option_key: 'value3', position: 2},
      ]);
    });

    it('should handle single value insertion', async () => {
      mockInsert.mockResolvedValue({error: null});
      mockFrom.mockReturnValue({insert: mockInsert});

      await repository.insertSelections('answer123', ['value1']);

      expect(mockInsert).toHaveBeenCalledWith([
        {answer_id: 'answer123', option_key: 'value1', position: 0},
      ]);
    });

    it('should throw error when insert fails', async () => {
      const mockError = {message: 'Insert failed'};

      mockInsert.mockResolvedValue({error: mockError});
      mockFrom.mockReturnValue({insert: mockInsert});

      await expect(
        repository.insertSelections('answer123', ['value1']),
      ).rejects.toThrow('Failed to insert value selections: Insert failed');
    });
  });
});
