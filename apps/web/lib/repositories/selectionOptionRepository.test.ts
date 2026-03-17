/**
 * @jest-environment node
 */
import {SelectionOptionRepository, SelectionOption} from './selectionOptionRepository';

import {supabase} from '@/lib/supabase';

jest.mock('@/lib/supabase', () => ({
  supabase: {
    from: jest.fn(),
  },
}));

describe('SelectionOptionRepository', () => {
  let repository: SelectionOptionRepository;
  let mockFrom: jest.Mock;
  let mockSelect: jest.Mock;
  let mockOrder: jest.Mock;
  let mockEq: jest.Mock;
  let mockIn: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    repository = new SelectionOptionRepository();

    mockOrder = jest.fn();
    mockEq = jest.fn().mockReturnValue({order: mockOrder});
    mockIn = jest.fn();
    mockSelect = jest
      .fn()
      .mockReturnValue({order: mockOrder, eq: mockEq, in: mockIn});
    mockFrom = jest.fn().mockReturnValue({select: mockSelect});

    (supabase.from as jest.Mock) = mockFrom;
  });

  describe('getAllOptions', () => {
    it('should fetch all selection options ordered by key', async () => {
      const mockData: SelectionOption[] = [
        {key: 'area_1', label_de: 'Area 1', option_type: 'area'},
        {key: 'value_1', label_de: 'Value 1', option_type: 'value'},
      ];

      mockOrder.mockResolvedValue({data: mockData, error: null});

      const result = await repository.getAllOptions();

      expect(mockFrom).toHaveBeenCalledWith('evp_selection_options');
      expect(mockSelect).toHaveBeenCalledWith('*');
      expect(mockOrder).toHaveBeenCalledWith('key', {ascending: true});
      expect(result).toEqual(mockData);
    });

    it('should return empty array when no data found', async () => {
      mockOrder.mockResolvedValue({data: [], error: null});

      const result = await repository.getAllOptions();

      expect(result).toEqual([]);
    });

    it('should handle null data response', async () => {
      mockOrder.mockResolvedValue({data: null, error: null});

      const result = await repository.getAllOptions();

      expect(result).toEqual([]);
    });

    it('should throw error when database query fails', async () => {
      mockOrder.mockResolvedValue({
        data: null,
        error: {message: 'Query failed'},
      });

      await expect(repository.getAllOptions()).rejects.toThrow(
        'Failed to fetch selection options: Query failed',
      );
    });
  });

  describe('getOptionsByType', () => {
    it('should fetch value options by type', async () => {
      const mockData: SelectionOption[] = [
        {key: 'value_1', label_de: 'Value 1', option_type: 'value'},
        {key: 'value_2', label_de: 'Value 2', option_type: 'value'},
      ];

      mockOrder.mockResolvedValue({data: mockData, error: null});

      const result = await repository.getOptionsByType('value');

      expect(mockFrom).toHaveBeenCalledWith('evp_selection_options');
      expect(mockEq).toHaveBeenCalledWith('option_type', 'value');
      expect(mockOrder).toHaveBeenCalledWith('key', {ascending: true});
      expect(result).toEqual(mockData);
    });

    it('should fetch area options by type', async () => {
      const mockData: SelectionOption[] = [
        {key: 'area_1', label_de: 'Area 1', option_type: 'area'},
      ];

      mockOrder.mockResolvedValue({data: mockData, error: null});

      const result = await repository.getOptionsByType('area');

      expect(mockEq).toHaveBeenCalledWith('option_type', 'area');
      expect(result).toEqual(mockData);
    });

    it('should return empty array when no options of type found', async () => {
      mockOrder.mockResolvedValue({data: null, error: null});

      const result = await repository.getOptionsByType('value');

      expect(result).toEqual([]);
    });

    it('should throw error with type name when database query fails', async () => {
      mockOrder.mockResolvedValue({
        data: null,
        error: {message: 'DB error'},
      });

      await expect(repository.getOptionsByType('area')).rejects.toThrow(
        'Failed to fetch area options: DB error',
      );
    });
  });

  describe('getOptionsByKeys', () => {
    it('should return empty array immediately when keys array is empty', async () => {
      const result = await repository.getOptionsByKeys([]);

      expect(mockFrom).not.toHaveBeenCalled();
      expect(result).toEqual([]);
    });

    it('should fetch options by keys', async () => {
      const mockData: SelectionOption[] = [
        {key: 'value_1', label_de: 'Value 1', option_type: 'value'},
        {key: 'area_1', label_de: 'Area 1', option_type: 'area'},
      ];

      mockIn.mockResolvedValue({data: mockData, error: null});

      const result = await repository.getOptionsByKeys(['value_1', 'area_1']);

      expect(mockFrom).toHaveBeenCalledWith('evp_selection_options');
      expect(mockIn).toHaveBeenCalledWith('key', ['value_1', 'area_1']);
      expect(result).toEqual(mockData);
    });

    it('should handle null data response', async () => {
      mockIn.mockResolvedValue({data: null, error: null});

      const result = await repository.getOptionsByKeys(['some_key']);

      expect(result).toEqual([]);
    });

    it('should throw error when database query fails', async () => {
      mockIn.mockResolvedValue({
        data: null,
        error: {message: 'Fetch by keys failed'},
      });

      await expect(repository.getOptionsByKeys(['key1'])).rejects.toThrow(
        'Failed to fetch options by keys: Fetch by keys failed',
      );
    });

    it('should handle single key lookup', async () => {
      const mockData: SelectionOption[] = [
        {key: 'single_key', label_de: 'Single', option_type: 'value'},
      ];

      mockIn.mockResolvedValue({data: mockData, error: null});

      const result = await repository.getOptionsByKeys(['single_key']);

      expect(result).toHaveLength(1);
      expect(result[0].key).toBe('single_key');
    });
  });
});
