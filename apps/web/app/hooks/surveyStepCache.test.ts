import {
  fetchStepFromApi,
  getErrorMessage,
  mergeSavedAnswers,
} from './surveyStepCache';
import type {StepData} from './surveyStepCache';

global.fetch = jest.fn();

const MOCK_STEP_DATA: StepData = {
  questions: [
    {
      answer: null,
      id: 'q1',
      key: 'culture',
      prompt: 'Describe your culture',
      question_type: 'multi_select',
      selection_limit: 5,
    },
  ],
  step: 1,
};

describe('surveyStepCache', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('fetchStepFromApi', () => {
    it('returns parsed JSON on a successful response', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        json: jest.fn().mockResolvedValue(MOCK_STEP_DATA),
        ok: true,
      });

      const result = await fetchStepFromApi(
        '/api/employee-survey/step/1?submission_id=sub-1',
      );

      expect(result).toEqual(MOCK_STEP_DATA);
    });

    it('throws with server message when response is not ok', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        json: jest.fn().mockResolvedValue({message: 'Not authorized'}),
        ok: false,
      });

      await expect(
        fetchStepFromApi('/api/employee-survey/step/1?submission_id=sub-1'),
      ).rejects.toThrow('Not authorized');
    });

    it('uses fallback message when error response has no message', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        json: jest.fn().mockResolvedValue({}),
        ok: false,
      });

      await expect(
        fetchStepFromApi('/api/employee-survey/step/1?submission_id=sub-1'),
      ).rejects.toThrow('Failed to fetch survey data');
    });
  });

  describe('getErrorMessage', () => {
    it('returns the error message for Error instances', () => {
      expect(getErrorMessage(new Error('Something failed'))).toBe(
        'Something failed',
      );
    });

    it('returns fallback message for non-Error values', () => {
      expect(getErrorMessage('plain string')).toBe('An error occurred');
      expect(getErrorMessage(42)).toBe('An error occurred');
      expect(getErrorMessage(null)).toBe('An error occurred');
    });
  });

  describe('mergeSavedAnswers', () => {
    it('merges selected_values into matching questions', () => {
      const stepData: StepData = {
        questions: [
          {
            id: 'q1',
            key: 'values',
            prompt: 'Pick values',
            question_type: 'multi_select',
            selection_limit: 5,
          },
        ],
        step: 1,
      };

      const result = mergeSavedAnswers(stepData, [
        {question_id: 'q1', selected_values: ['v1', 'v2']},
      ]);

      expect(result.questions[0].answer).toEqual({values: ['v1', 'v2']});
    });

    it('merges answer_text into matching questions', () => {
      const stepData: StepData = {
        questions: [
          {
            id: 'q1',
            key: 'description',
            prompt: 'Describe',
            question_type: 'free_text',
            selection_limit: null,
          },
        ],
        step: 2,
      };

      const result = mergeSavedAnswers(stepData, [
        {answer_text: 'My answer', question_id: 'q1'},
      ]);

      expect(result.questions[0].answer).toEqual({text: 'My answer'});
    });

    it('sets answer to null when answer_text is empty string', () => {
      const stepData: StepData = {
        questions: [
          {
            id: 'q1',
            key: 'description',
            prompt: 'Describe',
            question_type: 'free_text',
            selection_limit: null,
          },
        ],
        step: 2,
      };

      const result = mergeSavedAnswers(stepData, [
        {answer_text: '', question_id: 'q1'},
      ]);

      expect(result.questions[0].answer).toBeNull();
    });

    it('leaves questions unchanged when no matching answer is found', () => {
      const stepData: StepData = {
        questions: [
          {
            id: 'q1',
            key: 'test',
            prompt: 'Test',
            question_type: 'free_text',
            selection_limit: null,
          },
        ],
        step: 3,
      };

      const result = mergeSavedAnswers(stepData, [
        {answer_text: 'Not relevant', question_id: 'other-id'},
      ]);

      expect(result.questions[0]).toEqual(stepData.questions[0]);
    });
  });
});
