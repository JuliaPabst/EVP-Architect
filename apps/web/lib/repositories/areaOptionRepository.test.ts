/**
 * @jest-environment node
 */
import {AreaOptionRepository} from './areaOptionRepository';

import {supabase} from '@/lib/supabase';

jest.mock('@/lib/supabase', () => ({
  supabase: {
    from: jest.fn(),
  },
}));

describe('AreaOptionRepository', () => {
  let repository: AreaOptionRepository;
  let mockFrom: jest.Mock;
  let mockSelect: jest.Mock;
  let mockOrder: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    repository = new AreaOptionRepository();

    mockOrder = jest.fn();
    mockSelect = jest.fn().mockReturnValue({order: mockOrder});
    mockFrom = jest.fn().mockReturnValue({select: mockSelect});

    (supabase.from as jest.Mock) = mockFrom;
  });

  describe('getAllAreaOptions', () => {
    it('should fetch all area options ordered by key', async () => {
      const mockData = [
        {key: 'benefits', label_de: 'Benefits'},
        {key: 'culture', label_de: 'Unternehmenskultur'},
      ];

      mockOrder.mockResolvedValue({data: mockData, error: null});

      const result = await repository.getAllAreaOptions();

      expect(mockFrom).toHaveBeenCalledWith('evp_area_options');
      expect(mockSelect).toHaveBeenCalledWith('*');
      expect(mockOrder).toHaveBeenCalledWith('key', {ascending: true});
      expect(result).toEqual([
        {label: 'Benefits', value_key: 'benefits'},
        {label: 'Unternehmenskultur', value_key: 'culture'},
      ]);
    });

    it('should map key to value_key and label_de to label', async () => {
      mockOrder.mockResolvedValue({
        data: [{key: 'growth', label_de: 'Wachstum'}],
        error: null,
      });

      const result = await repository.getAllAreaOptions();

      expect(result[0].value_key).toBe('growth');
      expect(result[0].label).toBe('Wachstum');
      expect(result[0]).not.toHaveProperty('key');
      expect(result[0]).not.toHaveProperty('label_de');
    });

    it('should return empty array when no data found', async () => {
      mockOrder.mockResolvedValue({data: [], error: null});

      const result = await repository.getAllAreaOptions();

      expect(result).toEqual([]);
    });

    it('should handle null data response', async () => {
      mockOrder.mockResolvedValue({data: null, error: null});

      const result = await repository.getAllAreaOptions();

      expect(result).toEqual([]);
    });

    it('should throw error when database query fails', async () => {
      mockOrder.mockResolvedValue({
        data: null,
        error: {message: 'Connection timeout'},
      });

      await expect(repository.getAllAreaOptions()).rejects.toThrow(
        'Failed to fetch area options: Connection timeout',
      );
    });

    it('should handle multiple area options', async () => {
      const mockData = [
        {key: 'atmosphere', label_de: 'Arbeitsatmosphäre'},
        {key: 'career', label_de: 'Karriere/Weiterbildung'},
        {key: 'communication', label_de: 'Kommunikation'},
        {key: 'management', label_de: 'Vorgesetztenverhalten'},
        {key: 'work_life', label_de: 'Work-Life-Balance'},
      ];

      mockOrder.mockResolvedValue({data: mockData, error: null});

      const result = await repository.getAllAreaOptions();

      expect(result).toHaveLength(5);
      expect(result[0]).toEqual({label: 'Arbeitsatmosphäre', value_key: 'atmosphere'});
      expect(result[4]).toEqual({label: 'Work-Life-Balance', value_key: 'work_life'});
    });
  });
});
