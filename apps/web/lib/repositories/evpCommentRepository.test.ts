/**
 * @jest-environment node
 */
import {EvpCommentRepository} from './evpCommentRepository';

import {supabase} from '@/lib/supabase';

jest.mock('@/lib/supabase', () => ({
  supabase: {
    from: jest.fn(),
  },
}));

describe('EvpCommentRepository', () => {
  let repository: EvpCommentRepository;
  let mockFrom: jest.Mock;
  let mockInsert: jest.Mock;
  let mockSelect: jest.Mock;
  let mockSingle: jest.Mock;
  let mockEq: jest.Mock;
  let mockOrder: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    repository = new EvpCommentRepository();

    mockSingle = jest.fn();
    mockOrder = jest.fn();
    mockEq = jest.fn();
    mockSelect = jest.fn();
    mockInsert = jest.fn();
    mockFrom = jest.fn();

    (supabase.from as jest.Mock) = mockFrom;
  });

  describe('save', () => {
    const mockComment = {
      comment_text: 'Please make it shorter',
      created_at: '2026-01-01T00:00:00Z',
      id: 'comment-1',
      output_type: 'internal' as const,
      project_id: 'project-123',
    };

    it('should insert and return the saved comment', async () => {
      mockSingle.mockResolvedValue({data: mockComment, error: null});
      mockSelect.mockReturnValue({single: mockSingle});
      mockInsert.mockReturnValue({select: mockSelect});
      mockFrom.mockReturnValue({insert: mockInsert});

      const result = await repository.save({
        comment_text: 'Please make it shorter',
        output_type: 'internal',
        project_id: 'project-123',
      });

      expect(result).toEqual(mockComment);
      expect(mockFrom).toHaveBeenCalledWith('evp_generation_comments');
      expect(mockInsert).toHaveBeenCalledWith({
        comment_text: 'Please make it shorter',
        output_type: 'internal',
        project_id: 'project-123',
      });
    });

    it('should throw when insert returns an error', async () => {
      mockSingle.mockResolvedValue({
        data: null,
        error: {message: 'insert failed'},
      });
      mockSelect.mockReturnValue({single: mockSingle});
      mockInsert.mockReturnValue({select: mockSelect});
      mockFrom.mockReturnValue({insert: mockInsert});

      await expect(
        repository.save({
          comment_text: 'Test',
          output_type: 'external',
          project_id: 'project-123',
        }),
      ).rejects.toThrow('Failed to save comment: insert failed');
    });

    it('should save external output_type comments', async () => {
      const externalComment = {
        ...mockComment,
        output_type: 'external' as const,
      };

      mockSingle.mockResolvedValue({data: externalComment, error: null});
      mockSelect.mockReturnValue({single: mockSingle});
      mockInsert.mockReturnValue({select: mockSelect});
      mockFrom.mockReturnValue({insert: mockInsert});

      const result = await repository.save({
        comment_text: 'More appealing',
        output_type: 'external',
        project_id: 'project-123',
      });

      expect(result.output_type).toBe('external');
    });

    it('should save gap_analysis output_type comments', async () => {
      const gapComment = {...mockComment, output_type: 'gap_analysis' as const};

      mockSingle.mockResolvedValue({data: gapComment, error: null});
      mockSelect.mockReturnValue({single: mockSingle});
      mockInsert.mockReturnValue({select: mockSelect});
      mockFrom.mockReturnValue({insert: mockInsert});

      const result = await repository.save({
        comment_text: 'Expand on risks',
        output_type: 'gap_analysis',
        project_id: 'project-123',
      });

      expect(result.output_type).toBe('gap_analysis');
    });
  });

  describe('findAllByProjectAndOutputType', () => {
    const mockComments = [
      {
        comment_text: 'First comment',
        created_at: '2026-01-01T00:00:00Z',
        id: 'comment-1',
        output_type: 'internal' as const,
        project_id: 'project-123',
      },
      {
        comment_text: 'Second comment',
        created_at: '2026-01-02T00:00:00Z',
        id: 'comment-2',
        output_type: 'internal' as const,
        project_id: 'project-123',
      },
    ];

    it('should return all comments for a project and output type', async () => {
      mockOrder.mockResolvedValue({data: mockComments, error: null});
      mockEq
        .mockReturnValueOnce({eq: mockEq})
        .mockReturnValueOnce({order: mockOrder});
      mockSelect.mockReturnValue({eq: mockEq});
      mockFrom.mockReturnValue({select: mockSelect});

      const result = await repository.findAllByProjectAndOutputType(
        'project-123',
        'internal',
      );

      expect(result).toEqual(mockComments);
      expect(mockFrom).toHaveBeenCalledWith('evp_generation_comments');
      expect(mockSelect).toHaveBeenCalledWith('*');
    });

    it('should return empty array when no comments exist', async () => {
      mockOrder.mockResolvedValue({data: null, error: null});
      mockEq
        .mockReturnValueOnce({eq: mockEq})
        .mockReturnValueOnce({order: mockOrder});
      mockSelect.mockReturnValue({eq: mockEq});
      mockFrom.mockReturnValue({select: mockSelect});

      const result = await repository.findAllByProjectAndOutputType(
        'project-456',
        'external',
      );

      expect(result).toEqual([]);
    });

    it('should throw when query returns an error', async () => {
      mockOrder.mockResolvedValue({
        data: null,
        error: {message: 'query failed'},
      });
      mockEq
        .mockReturnValueOnce({eq: mockEq})
        .mockReturnValueOnce({order: mockOrder});
      mockSelect.mockReturnValue({eq: mockEq});
      mockFrom.mockReturnValue({select: mockSelect});

      await expect(
        repository.findAllByProjectAndOutputType('project-123', 'internal'),
      ).rejects.toThrow('Failed to fetch comments: query failed');
    });

    it('should filter by project_id and output_type', async () => {
      mockOrder.mockResolvedValue({data: [], error: null});
      const mockEq2 = jest.fn().mockReturnValue({order: mockOrder});
      const mockEq1 = jest.fn().mockReturnValue({eq: mockEq2});

      mockSelect.mockReturnValue({eq: mockEq1});
      mockFrom.mockReturnValue({select: mockSelect});

      await repository.findAllByProjectAndOutputType(
        'project-123',
        'gap_analysis',
      );

      expect(mockEq1).toHaveBeenCalledWith('project_id', 'project-123');
      expect(mockEq2).toHaveBeenCalledWith('output_type', 'gap_analysis');
    });

    it('should order results by created_at ascending', async () => {
      mockOrder.mockResolvedValue({data: [], error: null});
      const mockEq2 = jest.fn().mockReturnValue({order: mockOrder});
      const mockEq1 = jest.fn().mockReturnValue({eq: mockEq2});

      mockSelect.mockReturnValue({eq: mockEq1});
      mockFrom.mockReturnValue({select: mockSelect});

      await repository.findAllByProjectAndOutputType('project-123', 'internal');

      expect(mockOrder).toHaveBeenCalledWith('created_at', {ascending: true});
    });
  });
});
