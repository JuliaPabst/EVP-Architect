/**
 * @jest-environment node
 */
import {ValueOptionRepository, ValueOption} from './valueOptionRepository';

import {supabase} from '@/lib/supabase';

jest.mock('@/lib/supabase', () => ({
  supabase: {
    from: jest.fn(),
  },
}));

describe('ValueOptionRepository', () => {
  let repository: ValueOptionRepository;
  let mockFrom: jest.Mock;
  let mockSelect: jest.Mock;
  let mockOrder: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    repository = new ValueOptionRepository();

    // Set up the mock chain
    mockOrder = jest.fn();
    mockSelect = jest.fn().mockReturnValue({order: mockOrder});
    mockFrom = jest.fn();

    (supabase.from as jest.Mock) = mockFrom;
  });

  describe('getAllValueOptions', () => {
    it('should fetch all value options ordered by key', async () => {
      const mockData: ValueOption[] = [
        {key: 'autonomy', label_de: 'Autonomie'},
        {key: 'innovation', label_de: 'Innovation'},
        {key: 'work_life_balance', label_de: 'Work-Life-Balance'},
      ];

      mockOrder.mockResolvedValue({data: mockData, error: null});
      mockFrom.mockReturnValue({select: mockSelect});

      const result = await repository.getAllValueOptions();

      expect(mockFrom).toHaveBeenCalledWith('evp_value_options');
      expect(mockSelect).toHaveBeenCalledWith('*');
      expect(mockOrder).toHaveBeenCalledWith('key', {ascending: true});
      expect(result).toEqual([
        {label: 'Autonomie', value_key: 'autonomy'},
        {label: 'Innovation', value_key: 'innovation'},
        {label: 'Work-Life-Balance', value_key: 'work_life_balance'},
      ]);
    });

    it('should map key to value_key and label_de to label', async () => {
      const mockData: ValueOption[] = [
        {key: 'test_key', label_de: 'Test Label'},
      ];

      mockOrder.mockResolvedValue({data: mockData, error: null});
      mockFrom.mockReturnValue({select: mockSelect});

      const result = await repository.getAllValueOptions();

      expect(result).toHaveLength(1);
      expect(result[0].value_key).toBe('test_key');
      expect(result[0].label).toBe('Test Label');
      expect(result[0]).not.toHaveProperty('key');
      expect(result[0]).not.toHaveProperty('label_de');
    });

    it('should return empty array when no value options found', async () => {
      mockOrder.mockResolvedValue({data: [], error: null});
      mockFrom.mockReturnValue({select: mockSelect});

      const result = await repository.getAllValueOptions();

      expect(result).toEqual([]);
    });

    it('should handle null data response', async () => {
      mockOrder.mockResolvedValue({data: null, error: null});
      mockFrom.mockReturnValue({select: mockSelect});

      const result = await repository.getAllValueOptions();

      expect(result).toEqual([]);
    });

    it('should throw error when database query fails', async () => {
      const mockError = {message: 'Connection timeout'};

      mockOrder.mockResolvedValue({data: null, error: mockError});
      mockFrom.mockReturnValue({select: mockSelect});

      await expect(repository.getAllValueOptions()).rejects.toThrow(
        'Failed to fetch value options: Connection timeout',
      );
    });

    it('should handle multiple value options with various keys', async () => {
      const mockData: ValueOption[] = [
        {key: 'career_development', label_de: 'Karriereentwicklung'},
        {key: 'collaboration', label_de: 'Zusammenarbeit'},
        {key: 'compensation', label_de: 'Vergütung'},
        {key: 'flexibility', label_de: 'Flexibilität'},
        {key: 'recognition', label_de: 'Anerkennung'},
      ];

      mockOrder.mockResolvedValue({data: mockData, error: null});
      mockFrom.mockReturnValue({select: mockSelect});

      const result = await repository.getAllValueOptions();

      expect(result).toHaveLength(5);
      expect(result[0]).toEqual({
        label: 'Karriereentwicklung',
        value_key: 'career_development',
      });
      expect(result[4]).toEqual({
        label: 'Anerkennung',
        value_key: 'recognition',
      });
    });

    it('should maintain order as returned from database', async () => {
      const mockData: ValueOption[] = [
        {key: 'a_value', label_de: 'A Value'},
        {key: 'b_value', label_de: 'B Value'},
        {key: 'c_value', label_de: 'C Value'},
      ];

      mockOrder.mockResolvedValue({data: mockData, error: null});
      mockFrom.mockReturnValue({select: mockSelect});

      const result = await repository.getAllValueOptions();

      expect(result[0].value_key).toBe('a_value');
      expect(result[1].value_key).toBe('b_value');
      expect(result[2].value_key).toBe('c_value');
    });

    it('should handle special characters in labels', async () => {
      const mockData: ValueOption[] = [
        {key: 'test', label_de: 'Test & Qualität'},
      ];

      mockOrder.mockResolvedValue({data: mockData, error: null});
      mockFrom.mockReturnValue({select: mockSelect});

      const result = await repository.getAllValueOptions();

      expect(result[0].label).toBe('Test & Qualität');
    });

    it('should handle underscores and dashes in keys', async () => {
      const mockData: ValueOption[] = [
        {key: 'work_life_balance', label_de: 'Work-Life-Balance'},
        {key: 'employee-benefits', label_de: 'Mitarbeitervorteile'},
      ];

      mockOrder.mockResolvedValue({data: mockData, error: null});
      mockFrom.mockReturnValue({select: mockSelect});

      const result = await repository.getAllValueOptions();

      expect(result[0].value_key).toBe('work_life_balance');
      expect(result[1].value_key).toBe('employee-benefits');
    });
  });
});
