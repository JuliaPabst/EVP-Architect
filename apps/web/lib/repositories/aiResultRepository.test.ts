/**
 * @jest-environment node
 */
import {AiResultRepository} from './aiResultRepository';

import {supabase} from '@/lib/supabase';

jest.mock('@/lib/supabase', () => ({
  supabase: {
    from: jest.fn(),
  },
}));

describe('AiResultRepository', () => {
  let repository: AiResultRepository;
  let mockFrom: jest.Mock;
  let mockInsert: jest.Mock;
  let mockSelect: jest.Mock;
  let mockSingle: jest.Mock;
  let mockMaybeSingle: jest.Mock;
  let mockEq: jest.Mock;
  let mockOrder: jest.Mock;
  let mockLimit: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    repository = new AiResultRepository();

    mockSingle = jest.fn();
    mockMaybeSingle = jest.fn();
    mockLimit = jest.fn();
    mockOrder = jest.fn();
    mockEq = jest.fn();
    mockSelect = jest.fn();
    mockInsert = jest.fn();
    mockFrom = jest.fn();

    (supabase.from as jest.Mock) = mockFrom;
  });

  describe('save', () => {
    /* eslint-disable sort-keys */
    const mockResult = {
      generated_at: '2026-01-01T00:00:00Z',
      id: 'result-1',
      input_snapshot: {},
      model_used: 'data_assembly',
      pipeline_step: 'assembly' as const,
      project_id: 'project-1',
      result_json: {key: 'value'},
      result_text: null,
      target_audience: null,
    };
    /* eslint-enable sort-keys */

    it('should insert and return the saved record', async () => {
      mockSingle.mockResolvedValue({data: mockResult, error: null});
      mockSelect.mockReturnValue({single: mockSingle});
      mockInsert.mockReturnValue({select: mockSelect});
      mockFrom.mockReturnValue({insert: mockInsert});

      const result = await repository.save({
        input_snapshot: {},
        model_used: 'data_assembly',
        pipeline_step: 'assembly',
        project_id: 'project-1',
        result_json: {key: 'value'},
      });

      expect(mockFrom).toHaveBeenCalledWith('evp_ai_results');
      expect(mockInsert).toHaveBeenCalledWith(
        expect.objectContaining({
          model_used: 'data_assembly',
          pipeline_step: 'assembly',
          project_id: 'project-1',
        }),
      );
      expect(result).toEqual(mockResult);
    });

    it('should default optional fields to null when not provided', async () => {
      mockSingle.mockResolvedValue({data: mockResult, error: null});
      mockSelect.mockReturnValue({single: mockSingle});
      mockInsert.mockReturnValue({select: mockSelect});
      mockFrom.mockReturnValue({insert: mockInsert});

      await repository.save({
        input_snapshot: {},
        model_used: 'data_assembly',
        pipeline_step: 'assembly',
        project_id: 'project-1',
      });

      expect(mockInsert).toHaveBeenCalledWith(
        expect.objectContaining({
          result_json: null,
          result_text: null,
          target_audience: null,
        }),
      );
    });

    it('should pass result_text and target_audience when provided', async () => {
      mockSingle.mockResolvedValue({data: mockResult, error: null});
      mockSelect.mockReturnValue({single: mockSingle});
      mockInsert.mockReturnValue({select: mockSelect});
      mockFrom.mockReturnValue({insert: mockInsert});

      await repository.save({
        input_snapshot: {},
        model_used: 'claude-sonnet-4-6',
        pipeline_step: 'external',
        project_id: 'project-1',
        result_text: 'Generated text',
        target_audience: 'engineers',
      });

      expect(mockInsert).toHaveBeenCalledWith(
        expect.objectContaining({
          model_used: 'claude-sonnet-4-6',
          pipeline_step: 'external',
          result_text: 'Generated text',
          target_audience: 'engineers',
        }),
      );
    });

    it('should throw when insert fails', async () => {
      mockSingle.mockResolvedValue({data: null, error: {message: 'DB error'}});
      mockSelect.mockReturnValue({single: mockSingle});
      mockInsert.mockReturnValue({select: mockSelect});
      mockFrom.mockReturnValue({insert: mockInsert});

      await expect(
        repository.save({
          input_snapshot: {},
          model_used: 'data_assembly',
          pipeline_step: 'assembly',
          project_id: 'project-1',
        }),
      ).rejects.toThrow('Failed to save AI result: DB error');
    });
  });

  describe('findLatestByStep', () => {
    it('should return the latest result for a project and step', async () => {
      /* eslint-disable sort-keys */
      const mockResult = {
        id: 'result-1',
        pipeline_step: 'assembly' as const,
        project_id: 'project-1',
      };
      /* eslint-enable sort-keys */

      mockMaybeSingle.mockResolvedValue({data: mockResult, error: null});
      mockLimit.mockReturnValue({maybeSingle: mockMaybeSingle});
      mockOrder.mockReturnValue({limit: mockLimit});
      mockEq.mockReturnValue({order: mockOrder});
      mockEq.mockReturnValueOnce({eq: mockEq});
      mockSelect.mockReturnValue({eq: mockEq});
      mockFrom.mockReturnValue({select: mockSelect});

      const result = await repository.findLatestByStep('project-1', 'assembly');

      expect(mockFrom).toHaveBeenCalledWith('evp_ai_results');
      expect(mockEq).toHaveBeenCalledWith('project_id', 'project-1');
      expect(mockEq).toHaveBeenCalledWith('pipeline_step', 'assembly');
      expect(mockOrder).toHaveBeenCalledWith('generated_at', {
        ascending: false,
      });
      expect(result).toEqual(mockResult);
    });

    it('should return null when no result is found', async () => {
      mockMaybeSingle.mockResolvedValue({data: null, error: null});
      mockLimit.mockReturnValue({maybeSingle: mockMaybeSingle});
      mockOrder.mockReturnValue({limit: mockLimit});
      mockEq.mockReturnValue({order: mockOrder});
      mockEq.mockReturnValueOnce({eq: mockEq});
      mockSelect.mockReturnValue({eq: mockEq});
      mockFrom.mockReturnValue({select: mockSelect});

      const result = await repository.findLatestByStep('project-1', 'analysis');

      expect(result).toBeNull();
    });

    it('should throw when query fails', async () => {
      mockMaybeSingle.mockResolvedValue({
        data: null,
        error: {message: 'Connection lost'},
      });
      mockLimit.mockReturnValue({maybeSingle: mockMaybeSingle});
      mockOrder.mockReturnValue({limit: mockLimit});
      mockEq.mockReturnValue({order: mockOrder});
      mockEq.mockReturnValueOnce({eq: mockEq});
      mockSelect.mockReturnValue({eq: mockEq});
      mockFrom.mockReturnValue({select: mockSelect});

      await expect(
        repository.findLatestByStep('project-1', 'assembly'),
      ).rejects.toThrow('Failed to fetch AI result: Connection lost');
    });

    it.each([
      'assembly',
      'analysis',
      'internal',
      'external',
      'gap_analysis',
    ] as const)('should accept pipeline_step: %s', async step => {
      mockMaybeSingle.mockResolvedValue({data: null, error: null});
      mockLimit.mockReturnValue({maybeSingle: mockMaybeSingle});
      mockOrder.mockReturnValue({limit: mockLimit});
      mockEq.mockReturnValue({order: mockOrder});
      mockEq.mockReturnValueOnce({eq: mockEq});
      mockSelect.mockReturnValue({eq: mockEq});
      mockFrom.mockReturnValue({select: mockSelect});

      await repository.findLatestByStep('project-1', step);

      expect(mockEq).toHaveBeenCalledWith('pipeline_step', step);
    });
  });

  describe('findAllByProject', () => {
    it('should return all results for a project without step filter', async () => {
      /* eslint-disable sort-keys */
      const mockResults = [
        {
          id: 'result-1',
          pipeline_step: 'assembly' as const,
          project_id: 'project-1',
        },
        {
          id: 'result-2',
          pipeline_step: 'analysis' as const,
          project_id: 'project-1',
        },
      ];
      /* eslint-enable sort-keys */

      mockOrder.mockResolvedValue({data: mockResults, error: null});
      mockEq.mockReturnValue({order: mockOrder});
      mockSelect.mockReturnValue({eq: mockEq});
      mockFrom.mockReturnValue({select: mockSelect});

      const results = await repository.findAllByProject('project-1');

      expect(mockFrom).toHaveBeenCalledWith('evp_ai_results');
      expect(mockEq).toHaveBeenCalledWith('project_id', 'project-1');
      expect(mockOrder).toHaveBeenCalledWith('generated_at', {
        ascending: false,
      });
      expect(results).toEqual(mockResults);
    });

    it('should return filtered results when pipeline_step is provided', async () => {
      /* eslint-disable sort-keys */
      const mockResult = {
        id: 'result-1',
        pipeline_step: 'assembly' as const,
        project_id: 'project-1',
      };
      /* eslint-enable sort-keys */

      const secondEqFinal = jest.fn();

      secondEqFinal.mockResolvedValue({data: [mockResult], error: null});

      mockOrder.mockReturnValue({eq: secondEqFinal});
      mockEq.mockReturnValue({order: mockOrder});
      mockSelect.mockReturnValue({eq: mockEq});
      mockFrom.mockReturnValue({select: mockSelect});

      const results = await repository.findAllByProject(
        'project-1',
        'assembly',
      );

      expect(mockEq).toHaveBeenCalledWith('project_id', 'project-1');
      expect(secondEqFinal).toHaveBeenCalledWith('pipeline_step', 'assembly');
      expect(results).toEqual([mockResult]);
    });

    it('should return empty array when no results found', async () => {
      mockOrder.mockResolvedValue({data: null, error: null});
      mockEq.mockReturnValue({order: mockOrder});
      mockSelect.mockReturnValue({eq: mockEq});
      mockFrom.mockReturnValue({select: mockSelect});

      const results = await repository.findAllByProject('project-1');

      expect(results).toEqual([]);
    });

    it('should throw when query fails', async () => {
      mockOrder.mockResolvedValue({
        data: null,
        error: {message: 'Query failed'},
      });
      mockEq.mockReturnValue({order: mockOrder});
      mockSelect.mockReturnValue({eq: mockEq});
      mockFrom.mockReturnValue({select: mockSelect});

      await expect(repository.findAllByProject('project-1')).rejects.toThrow(
        'Failed to fetch AI results: Query failed',
      );
    });
  });
});
