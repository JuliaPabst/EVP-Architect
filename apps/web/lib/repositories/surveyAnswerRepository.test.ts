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

  describe('getAnswersWithQuestions', () => {
    it('should return empty array for empty submissionIds', async () => {
      const result = await repository.getAnswersWithQuestions([]);

      expect(result).toEqual([]);
      expect(mockFrom).not.toHaveBeenCalled();
    });

    it('should fetch and map answers with their question context', async () => {
      /* eslint-disable sort-keys */
      const rawRow = {
        id: 'a1',
        submission_id: 'sub-1',
        question_id: 'q1',
        answer_text: 'Great culture',
        answer_json: null,
        created_at: '2026-01-01',
        updated_at: '2026-01-01',
        evp_survey_questions: {
          key: 'culture',
          prompt: 'How is the culture?',
          question_type: 'text',
        },
      };
      /* eslint-enable sort-keys */

      mockIn.mockResolvedValue({data: [rawRow], error: null});
      mockSelect.mockReturnValue({in: mockIn});
      mockFrom.mockReturnValue({select: mockSelect});

      const result = await repository.getAnswersWithQuestions(['sub-1']);

      expect(mockFrom).toHaveBeenCalledWith('evp_survey_answers');
      expect(mockIn).toHaveBeenCalledWith('submission_id', ['sub-1']);
      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        answer_json: null,
        answer_text: 'Great culture',
        created_at: '2026-01-01',
        id: 'a1',
        question: {
          key: 'culture',
          prompt: 'How is the culture?',
          question_type: 'text',
        },
        question_id: 'q1',
        submission_id: 'sub-1',
        updated_at: '2026-01-01',
      });
    });

    it('should return empty array when data is null', async () => {
      mockIn.mockResolvedValue({data: null, error: null});
      mockSelect.mockReturnValue({in: mockIn});
      mockFrom.mockReturnValue({select: mockSelect});

      const result = await repository.getAnswersWithQuestions(['sub-1']);

      expect(result).toEqual([]);
    });

    it('should default null timestamps to empty string', async () => {
      /* eslint-disable sort-keys */
      const rawRow = {
        id: 'a2',
        submission_id: 'sub-2',
        question_id: 'q2',
        answer_text: null,
        answer_json: null,
        created_at: null,
        updated_at: null,
        evp_survey_questions: {
          key: 'q_key',
          prompt: 'prompt',
          question_type: 'long_text',
        },
      };
      /* eslint-enable sort-keys */

      mockIn.mockResolvedValue({data: [rawRow], error: null});
      mockSelect.mockReturnValue({in: mockIn});
      mockFrom.mockReturnValue({select: mockSelect});

      const [row] = await repository.getAnswersWithQuestions(['sub-2']);

      expect(row.created_at).toBe('');
      expect(row.updated_at).toBe('');
    });

    it('should throw when evp_survey_questions is null', async () => {
      /* eslint-disable sort-keys */
      const rawRow = {
        id: 'a3',
        submission_id: 'sub-3',
        question_id: 'q3',
        answer_text: null,
        answer_json: null,
        created_at: '2026-01-01',
        updated_at: '2026-01-01',
        evp_survey_questions: null,
      };
      /* eslint-enable sort-keys */

      mockIn.mockResolvedValue({data: [rawRow], error: null});
      mockSelect.mockReturnValue({in: mockIn});
      mockFrom.mockReturnValue({select: mockSelect});

      await expect(
        repository.getAnswersWithQuestions(['sub-3']),
      ).rejects.toThrow('Missing question data for answer a3');
    });

    it('should throw when database query fails', async () => {
      mockIn.mockResolvedValue({data: null, error: {message: 'DB error'}});
      mockSelect.mockReturnValue({in: mockIn});
      mockFrom.mockReturnValue({select: mockSelect});

      await expect(
        repository.getAnswersWithQuestions(['sub-1']),
      ).rejects.toThrow('Failed to fetch answers with questions: DB error');
    });

    it('should batch all submission IDs in one query', async () => {
      mockIn.mockResolvedValue({data: [], error: null});
      mockSelect.mockReturnValue({in: mockIn});
      mockFrom.mockReturnValue({select: mockSelect});

      await repository.getAnswersWithQuestions(['sub-1', 'sub-2', 'sub-3']);

      expect(mockIn).toHaveBeenCalledWith('submission_id', [
        'sub-1',
        'sub-2',
        'sub-3',
      ]);
    });
  });
});
