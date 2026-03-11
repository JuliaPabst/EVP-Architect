/**
 * @jest-environment node
 */
import {SurveyAnswerRepository} from './surveyAnswerRepository';

import {supabase} from '@/lib/supabase';
import {SurveyAnswer} from '@/lib/types/survey';

jest.mock('@/lib/supabase', () => ({
  supabase: {
    from: jest.fn(),
  },
}));

describe('SurveyAnswerRepository', () => {
  let repository: SurveyAnswerRepository;
  let mockFrom: jest.Mock;
  let mockSelect: jest.Mock;
  let mockEq: jest.Mock;
  let mockIn: jest.Mock;
  let mockUpsert: jest.Mock;
  let mockSingle: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    repository = new SurveyAnswerRepository();

    // Set up the mock chain
    mockSingle = jest.fn();
    mockIn = jest.fn();
    mockEq = jest.fn();
    mockUpsert = jest.fn();
    mockSelect = jest.fn();
    mockFrom = jest.fn();

    (supabase.from as jest.Mock) = mockFrom;
  });

  describe('getAnswersByQuestions', () => {
    it('should return empty map for empty question IDs array', async () => {
      const result = await repository.getAnswersByQuestions('submission1', []);

      expect(result).toEqual(new Map());
      expect(mockFrom).not.toHaveBeenCalled();
    });

    it('should fetch and organize answers by question ID', async () => {
      const mockAnswers: SurveyAnswer[] = [
        {
          answer_text: 'Answer 1',
          created_at: '2024-01-01',
          id: 'a1',
          question_id: 'q1',
          submission_id: 'submission1',
          updated_at: '2024-01-01',
        },
        {
          answer_text: 'Answer 2',
          created_at: '2024-01-01',
          id: 'a2',
          question_id: 'q2',
          submission_id: 'submission1',
          updated_at: '2024-01-01',
        },
      ];

      mockIn.mockResolvedValue({data: mockAnswers, error: null});
      mockEq.mockReturnValue({in: mockIn});
      mockSelect.mockReturnValue({eq: mockEq});
      mockFrom.mockReturnValue({select: mockSelect});

      const result = await repository.getAnswersByQuestions('submission1', [
        'q1',
        'q2',
      ]);

      expect(mockFrom).toHaveBeenCalledWith('evp_survey_answers');
      expect(mockSelect).toHaveBeenCalledWith('*');
      expect(mockEq).toHaveBeenCalledWith('submission_id', 'submission1');
      expect(mockIn).toHaveBeenCalledWith('question_id', ['q1', 'q2']);

      expect(result.get('q1')).toEqual(mockAnswers[0]);
      expect(result.get('q2')).toEqual(mockAnswers[1]);
      expect(result.size).toBe(2);
    });

    it('should handle empty data response', async () => {
      mockIn.mockResolvedValue({data: [], error: null});
      mockEq.mockReturnValue({in: mockIn});
      mockSelect.mockReturnValue({eq: mockEq});
      mockFrom.mockReturnValue({select: mockSelect});

      const result = await repository.getAnswersByQuestions('submission1', [
        'q1',
      ]);

      expect(result).toEqual(new Map());
    });

    it('should handle null data response', async () => {
      mockIn.mockResolvedValue({data: null, error: null});
      mockEq.mockReturnValue({in: mockIn});
      mockSelect.mockReturnValue({eq: mockEq});
      mockFrom.mockReturnValue({select: mockSelect});

      const result = await repository.getAnswersByQuestions('submission1', [
        'q1',
      ]);

      expect(result).toEqual(new Map());
    });

    it('should throw error when database query fails', async () => {
      const mockError = {message: 'Database error'};

      mockIn.mockResolvedValue({data: null, error: mockError});
      mockEq.mockReturnValue({in: mockIn});
      mockSelect.mockReturnValue({eq: mockEq});
      mockFrom.mockReturnValue({select: mockSelect});

      await expect(
        repository.getAnswersByQuestions('submission1', ['q1']),
      ).rejects.toThrow('Failed to fetch answers: Database error');
    });
  });

  describe('upsertAnswer', () => {
    const mockAnswer: SurveyAnswer = {
      answer_text: 'Test answer',
      created_at: '2024-01-01',
      id: 'a1',
      question_id: 'q1',
      submission_id: 'submission1',
      updated_at: '2024-01-01',
    };

    it('should insert a new answer with text', async () => {
      mockSingle.mockResolvedValue({data: mockAnswer, error: null});
      mockSelect.mockReturnValue({single: mockSingle});
      mockUpsert.mockReturnValue({select: mockSelect});
      mockFrom.mockReturnValue({upsert: mockUpsert});

      const result = await repository.upsertAnswer(
        'submission1',
        'q1',
        'Test answer',
      );

      expect(mockFrom).toHaveBeenCalledWith('evp_survey_answers');
      expect(mockUpsert).toHaveBeenCalledWith(
        {
          answer_text: 'Test answer',
          question_id: 'q1',
          submission_id: 'submission1',
        },
        {
          onConflict: 'submission_id,question_id',
        },
      );
      expect(mockSelect).toHaveBeenCalled();
      expect(mockSingle).toHaveBeenCalled();
      expect(result).toEqual(mockAnswer);
    });

    it('should insert a new answer with null text', async () => {
      const mockAnswerNull = {...mockAnswer, answer_text: null};

      mockSingle.mockResolvedValue({data: mockAnswerNull, error: null});
      mockSelect.mockReturnValue({single: mockSingle});
      mockUpsert.mockReturnValue({select: mockSelect});
      mockFrom.mockReturnValue({upsert: mockUpsert});

      const result = await repository.upsertAnswer('submission1', 'q1', null);

      expect(mockUpsert).toHaveBeenCalledWith(
        {
          answer_text: null,
          question_id: 'q1',
          submission_id: 'submission1',
        },
        {
          onConflict: 'submission_id,question_id',
        },
      );
      expect(result).toEqual(mockAnswerNull);
    });

    it('should update an existing answer', async () => {
      const updatedAnswer = {...mockAnswer, answer_text: 'Updated answer'};

      mockSingle.mockResolvedValue({data: updatedAnswer, error: null});
      mockSelect.mockReturnValue({single: mockSingle});
      mockUpsert.mockReturnValue({select: mockSelect});
      mockFrom.mockReturnValue({upsert: mockUpsert});

      const result = await repository.upsertAnswer(
        'submission1',
        'q1',
        'Updated answer',
      );

      expect(result.answer_text).toBe('Updated answer');
    });

    it('should throw error when upsert fails', async () => {
      const mockError = {message: 'Constraint violation'};

      mockSingle.mockResolvedValue({data: null, error: mockError});
      mockSelect.mockReturnValue({single: mockSingle});
      mockUpsert.mockReturnValue({select: mockSelect});
      mockFrom.mockReturnValue({upsert: mockUpsert});

      await expect(
        repository.upsertAnswer('submission1', 'q1', 'Test'),
      ).rejects.toThrow('Failed to upsert answer: Constraint violation');
    });
  });

  describe('getAnsweredQuestionIds', () => {
    it('should fetch all answered question IDs for a submission', async () => {
      const mockData = [
        {question_id: 'q1'},
        {question_id: 'q2'},
        {question_id: 'q3'},
      ];

      mockEq.mockResolvedValue({data: mockData, error: null});
      mockSelect.mockReturnValue({eq: mockEq});
      mockFrom.mockReturnValue({select: mockSelect});

      const result = await repository.getAnsweredQuestionIds('submission1');

      expect(mockFrom).toHaveBeenCalledWith('evp_survey_answers');
      expect(mockSelect).toHaveBeenCalledWith('question_id');
      expect(mockEq).toHaveBeenCalledWith('submission_id', 'submission1');
      expect(result).toEqual(['q1', 'q2', 'q3']);
    });

    it('should return empty array when no answers found', async () => {
      mockEq.mockResolvedValue({data: [], error: null});
      mockSelect.mockReturnValue({eq: mockEq});
      mockFrom.mockReturnValue({select: mockSelect});

      const result = await repository.getAnsweredQuestionIds('submission1');

      expect(result).toEqual([]);
    });

    it('should handle null data response', async () => {
      mockEq.mockResolvedValue({data: null, error: null});
      mockSelect.mockReturnValue({eq: mockEq});
      mockFrom.mockReturnValue({select: mockSelect});

      const result = await repository.getAnsweredQuestionIds('submission1');

      expect(result).toEqual([]);
    });

    it('should throw error when database query fails', async () => {
      const mockError = {message: 'Connection lost'};

      mockEq.mockResolvedValue({data: null, error: mockError});
      mockSelect.mockReturnValue({eq: mockEq});
      mockFrom.mockReturnValue({select: mockSelect});

      await expect(
        repository.getAnsweredQuestionIds('submission1'),
      ).rejects.toThrow(
        'Failed to fetch answered question IDs: Connection lost',
      );
    });
  });
});
