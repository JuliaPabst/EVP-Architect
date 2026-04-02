/**
 * @jest-environment node
 */
/* eslint-disable sort-keys */
import EmployeeSurveyService from './employeeSurveyService';

import {QuestionOptionRepository} from '@/lib/repositories/questionOptionRepository';
import {SelectionOptionRepository} from '@/lib/repositories/selectionOptionRepository';
import {SurveyAnswerRepository} from '@/lib/repositories/surveyAnswerRepository';
import {SurveyQuestionRepository} from '@/lib/repositories/surveyQuestionRepository';
import {SurveySubmissionRepository} from '@/lib/repositories/surveySubmissionRepository';
import {ValueSelectionRepository} from '@/lib/repositories/valueSelectionRepository';

// Mock all repositories
jest.mock('@/lib/repositories/questionOptionRepository');
jest.mock('@/lib/repositories/selectionOptionRepository');
jest.mock('@/lib/repositories/surveyAnswerRepository');
jest.mock('@/lib/repositories/surveyQuestionRepository');
jest.mock('@/lib/repositories/surveySubmissionRepository');
jest.mock('@/lib/repositories/valueSelectionRepository');

const VALID_UUID = '550e8400-e29b-41d4-a716-446655440000';
const SUBMISSION_ID = 'sub-0000-0000-0000-000000000001';
const PROJECT_ID = 'proj-0000-0000-0000-000000000001';

function makeQuestion(overrides = {}) {
  return {
    id: VALID_UUID,
    key: 'test_key',
    prompt: 'Test prompt',
    question_type: 'text',
    selection_limit: null,
    step: 1,
    survey_type: 'employee',
    ...overrides,
  };
}

describe('EmployeeSurveyService', () => {
  let service: EmployeeSurveyService;
  let mockQuestionRepository: jest.Mocked<SurveyQuestionRepository>;
  let mockQuestionOptionRepository: jest.Mocked<QuestionOptionRepository>;
  let mockSubmissionRepository: jest.Mocked<SurveySubmissionRepository>;
  let mockAnswerRepository: jest.Mocked<SurveyAnswerRepository>;
  let mockSelectionOptionRepository: jest.Mocked<SelectionOptionRepository>;
  let mockValueSelectionRepository: jest.Mocked<ValueSelectionRepository>;

  beforeEach(() => {
    jest.clearAllMocks();

    service = new EmployeeSurveyService();

    mockQuestionRepository = jest.mocked(
      (
        SurveyQuestionRepository as jest.MockedClass<
          typeof SurveyQuestionRepository
        >
      ).mock.instances[0],
    );
    mockQuestionOptionRepository = jest.mocked(
      (
        QuestionOptionRepository as jest.MockedClass<
          typeof QuestionOptionRepository
        >
      ).mock.instances[0],
    );
    mockSubmissionRepository = jest.mocked(
      (
        SurveySubmissionRepository as jest.MockedClass<
          typeof SurveySubmissionRepository
        >
      ).mock.instances[0],
    );
    mockAnswerRepository = jest.mocked(
      (
        SurveyAnswerRepository as jest.MockedClass<
          typeof SurveyAnswerRepository
        >
      ).mock.instances[0],
    );
    mockSelectionOptionRepository = jest.mocked(
      (
        SelectionOptionRepository as jest.MockedClass<
          typeof SelectionOptionRepository
        >
      ).mock.instances[0],
    );
    mockValueSelectionRepository = jest.mocked(
      (
        ValueSelectionRepository as jest.MockedClass<
          typeof ValueSelectionRepository
        >
      ).mock.instances[0],
    );
  });

  describe('getOrCreateSubmission', () => {
    it('delegates to the submission repository and returns the submission id', async () => {
      mockSubmissionRepository.getOrCreateEmployeeSubmission.mockResolvedValue({
        id: SUBMISSION_ID,
      });

      const result = await service.getOrCreateSubmission(null, PROJECT_ID);

      expect(
        mockSubmissionRepository.getOrCreateEmployeeSubmission,
      ).toHaveBeenCalledWith(null, PROJECT_ID);
      expect(result).toEqual({id: SUBMISSION_ID});
    });

    it('passes an existing submissionId to the repository', async () => {
      mockSubmissionRepository.getOrCreateEmployeeSubmission.mockResolvedValue({
        id: SUBMISSION_ID,
      });

      await service.getOrCreateSubmission(SUBMISSION_ID, PROJECT_ID);

      expect(
        mockSubmissionRepository.getOrCreateEmployeeSubmission,
      ).toHaveBeenCalledWith(SUBMISSION_ID, PROJECT_ID);
    });
  });

  describe('getStepData', () => {
    it('returns step data with questions and no answers when there are no saved answers', async () => {
      const question = makeQuestion({question_type: 'text'});

      mockQuestionRepository.getQuestionsByStep.mockResolvedValue([question]);
      mockAnswerRepository.getAnswersByQuestions.mockResolvedValue(new Map());
      mockValueSelectionRepository.getSelectionsByAnswers.mockResolvedValue(
        new Map(),
      );
      mockQuestionOptionRepository.getOptionsByQuestionKeys.mockResolvedValue(
        new Map(),
      );
      mockSelectionOptionRepository.getAllOptions.mockResolvedValue([]);
      mockSelectionOptionRepository.getOptionsByType.mockResolvedValue([]);

      const result = await service.getStepData(SUBMISSION_ID, 1);

      expect(mockQuestionRepository.getQuestionsByStep).toHaveBeenCalledWith(
        'employee',
        1,
      );
      expect(result.step).toBe(1);
      expect(result.questions).toHaveLength(1);
      expect(result.questions[0].answer).toBeNull();
    });

    it('populates answer.text for a text question with an existing answer', async () => {
      const questionId = 'q-text-id';
      const question = makeQuestion({id: questionId, question_type: 'text'});
      const answerId = 'ans-1';

      mockQuestionRepository.getQuestionsByStep.mockResolvedValue([question]);
      mockAnswerRepository.getAnswersByQuestions.mockResolvedValue(
        new Map([[questionId, {answer_text: 'My answer', id: answerId}]]),
      );
      mockValueSelectionRepository.getSelectionsByAnswers.mockResolvedValue(
        new Map(),
      );
      mockQuestionOptionRepository.getOptionsByQuestionKeys.mockResolvedValue(
        new Map(),
      );
      mockSelectionOptionRepository.getAllOptions.mockResolvedValue([]);
      mockSelectionOptionRepository.getOptionsByType.mockResolvedValue([]);

      const result = await service.getStepData(SUBMISSION_ID, 2);

      expect(result.questions[0].answer).toEqual({text: 'My answer'});
    });

    it('populates answer.values for a multi_select question with saved selections', async () => {
      const questionId = 'q-multi-id';
      const answerId = 'ans-multi-1';
      const question = makeQuestion({
        id: questionId,
        key: 'generic_multi',
        question_type: 'multi_select',
      });

      mockQuestionRepository.getQuestionsByStep.mockResolvedValue([question]);
      mockAnswerRepository.getAnswersByQuestions.mockResolvedValue(
        new Map([[questionId, {answer_text: null, id: answerId}]]),
      );
      mockValueSelectionRepository.getSelectionsByAnswers.mockResolvedValue(
        new Map([[answerId, ['value_a', 'value_b']]]),
      );
      mockSelectionOptionRepository.getAllOptions.mockResolvedValue([
        {key: 'value_a', label_de: 'Wert A'},
        {key: 'value_b', label_de: 'Wert B'},
      ]);
      mockQuestionOptionRepository.getOptionsByQuestionKeys.mockResolvedValue(
        new Map(),
      );

      const result = await service.getStepData(SUBMISSION_ID, 1);

      expect(result.questions[0].answer).toEqual({
        values: ['value_a', 'value_b'],
      });
    });

    it('fetches value-type selection options for a core_values multi_select question', async () => {
      const question = makeQuestion({
        id: 'q-core',
        key: 'core_values',
        question_type: 'multi_select',
      });

      mockQuestionRepository.getQuestionsByStep.mockResolvedValue([question]);
      mockAnswerRepository.getAnswersByQuestions.mockResolvedValue(new Map());
      mockValueSelectionRepository.getSelectionsByAnswers.mockResolvedValue(
        new Map(),
      );
      mockSelectionOptionRepository.getOptionsByType.mockResolvedValue([]);
      mockQuestionOptionRepository.getOptionsByQuestionKeys.mockResolvedValue(
        new Map(),
      );

      await service.getStepData(SUBMISSION_ID, 1);

      expect(
        mockSelectionOptionRepository.getOptionsByType,
      ).toHaveBeenCalledWith('value');
    });

    it('fetches area-type selection options for an exclude_values multi_select question', async () => {
      const question = makeQuestion({
        id: 'q-exclude',
        key: 'exclude_values',
        question_type: 'multi_select',
      });

      mockQuestionRepository.getQuestionsByStep.mockResolvedValue([question]);
      mockAnswerRepository.getAnswersByQuestions.mockResolvedValue(new Map());
      mockValueSelectionRepository.getSelectionsByAnswers.mockResolvedValue(
        new Map(),
      );
      mockSelectionOptionRepository.getOptionsByType.mockResolvedValue([]);
      mockQuestionOptionRepository.getOptionsByQuestionKeys.mockResolvedValue(
        new Map(),
      );

      await service.getStepData(SUBMISSION_ID, 1);

      expect(
        mockSelectionOptionRepository.getOptionsByType,
      ).toHaveBeenCalledWith('area');
    });
  });

  describe('saveStepAnswers', () => {
    it('saves a text answer when validation passes', async () => {
      const questionId = VALID_UUID;
      const question = makeQuestion({
        id: questionId,
        question_type: 'text',
        step: 1,
      });

      mockQuestionRepository.getQuestionsByIds.mockResolvedValue(
        new Map([[questionId, question]]),
      );
      mockAnswerRepository.upsertAnswer.mockResolvedValue({id: 'new-ans-id'});

      await service.saveStepAnswers(SUBMISSION_ID, 1, [
        {answer_text: 'My text', question_id: questionId},
      ]);

      expect(mockAnswerRepository.upsertAnswer).toHaveBeenCalledWith(
        SUBMISSION_ID,
        questionId,
        'My text',
      );
    });

    it('saves a multi_select answer with selections', async () => {
      const questionId = VALID_UUID;
      const answerId = 'new-ans-ms';
      const question = makeQuestion({
        id: questionId,
        question_type: 'multi_select',
        step: 1,
      });

      mockQuestionRepository.getQuestionsByIds.mockResolvedValue(
        new Map([[questionId, question]]),
      );
      mockAnswerRepository.upsertAnswer.mockResolvedValue({id: answerId});
      mockValueSelectionRepository.deleteSelectionsByAnswer.mockResolvedValue(
        undefined,
      );
      mockValueSelectionRepository.insertSelections.mockResolvedValue(
        undefined,
      );

      await service.saveStepAnswers(SUBMISSION_ID, 1, [
        {question_id: questionId, selected_values: ['val_a', 'val_b']},
      ]);

      expect(
        mockValueSelectionRepository.deleteSelectionsByAnswer,
      ).toHaveBeenCalledWith(answerId);
      expect(
        mockValueSelectionRepository.insertSelections,
      ).toHaveBeenCalledWith(answerId, ['val_a', 'val_b']);
    });

    it('throws when question is not found', async () => {
      mockQuestionRepository.getQuestionsByIds.mockResolvedValue(new Map());

      await expect(
        service.saveStepAnswers(SUBMISSION_ID, 1, [
          {answer_text: 'text', question_id: VALID_UUID},
        ]),
      ).rejects.toThrow(`Question not found: ${VALID_UUID}`);
    });

    it('throws when question does not belong to the given step', async () => {
      const questionId = VALID_UUID;
      const question = makeQuestion({
        id: questionId,
        step: 2,
        survey_type: 'employee',
      });

      mockQuestionRepository.getQuestionsByIds.mockResolvedValue(
        new Map([[questionId, question]]),
      );

      await expect(
        service.saveStepAnswers(SUBMISSION_ID, 1, [
          {answer_text: 'text', question_id: questionId},
        ]),
      ).rejects.toThrow('Question does not belong to step 1');
    });

    it('throws when question is not an employee question', async () => {
      const questionId = VALID_UUID;
      const question = makeQuestion({
        id: questionId,
        step: 1,
        survey_type: 'employer',
      });

      mockQuestionRepository.getQuestionsByIds.mockResolvedValue(
        new Map([[questionId, question]]),
      );

      await expect(
        service.saveStepAnswers(SUBMISSION_ID, 1, [
          {answer_text: 'text', question_id: questionId},
        ]),
      ).rejects.toThrow('Question is not an employee question');
    });

    it('throws when answer_text is missing for a text question', async () => {
      const questionId = VALID_UUID;
      const question = makeQuestion({
        id: questionId,
        question_type: 'text',
        step: 1,
      });

      mockQuestionRepository.getQuestionsByIds.mockResolvedValue(
        new Map([[questionId, question]]),
      );

      await expect(
        service.saveStepAnswers(SUBMISSION_ID, 1, [{question_id: questionId}]),
      ).rejects.toThrow(`answer_text required for question ${questionId}`);
    });

    it('throws when selected_values are provided for a text question', async () => {
      const questionId = VALID_UUID;
      const question = makeQuestion({
        id: questionId,
        question_type: 'text',
        step: 1,
      });

      mockQuestionRepository.getQuestionsByIds.mockResolvedValue(
        new Map([[questionId, question]]),
      );

      await expect(
        service.saveStepAnswers(SUBMISSION_ID, 1, [
          {
            answer_text: 'text',
            question_id: questionId,
            selected_values: ['val'],
          },
        ]),
      ).rejects.toThrow(
        `selected_values must be empty for text question ${questionId}`,
      );
    });

    it('throws when no selected_values provided for a multi_select question', async () => {
      const questionId = VALID_UUID;
      const question = makeQuestion({
        id: questionId,
        question_type: 'multi_select',
        step: 1,
      });

      mockQuestionRepository.getQuestionsByIds.mockResolvedValue(
        new Map([[questionId, question]]),
      );

      await expect(
        service.saveStepAnswers(SUBMISSION_ID, 1, [
          {question_id: questionId, selected_values: []},
        ]),
      ).rejects.toThrow(
        `At least 1 value required for multi_select question ${questionId}`,
      );
    });

    it('throws when too many selected_values exceed the selection limit', async () => {
      const questionId = VALID_UUID;
      const question = makeQuestion({
        id: questionId,
        question_type: 'multi_select',
        selection_limit: 2,
        step: 1,
      });

      mockQuestionRepository.getQuestionsByIds.mockResolvedValue(
        new Map([[questionId, question]]),
      );

      await expect(
        service.saveStepAnswers(SUBMISSION_ID, 1, [
          {question_id: questionId, selected_values: ['a', 'b', 'c']},
        ]),
      ).rejects.toThrow(
        `Too many values for multi_select question ${questionId} (limit: 2)`,
      );
    });

    it('throws when answer_text is provided for a multi_select question', async () => {
      const questionId = VALID_UUID;
      const question = makeQuestion({
        id: questionId,
        question_type: 'multi_select',
        step: 1,
      });

      mockQuestionRepository.getQuestionsByIds.mockResolvedValue(
        new Map([[questionId, question]]),
      );

      await expect(
        service.saveStepAnswers(SUBMISSION_ID, 1, [
          {
            answer_text: 'should not be here',
            question_id: questionId,
            selected_values: ['val'],
          },
        ]),
      ).rejects.toThrow(
        `answer_text must be empty for multi_select question ${questionId}`,
      );
    });
  });
});
