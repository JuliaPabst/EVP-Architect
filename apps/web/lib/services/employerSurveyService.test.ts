/**
 * @jest-environment node
 */
/* eslint-disable sort-keys */
import EmployerSurveyService from './employerSurveyService';

import {ProjectRepository} from '@/lib/repositories/projectRepository';
import {QuestionOptionRepository} from '@/lib/repositories/questionOptionRepository';
import {SelectionOptionRepository} from '@/lib/repositories/selectionOptionRepository';
import {SurveyAnswerRepository} from '@/lib/repositories/surveyAnswerRepository';
import {SurveyQuestionRepository} from '@/lib/repositories/surveyQuestionRepository';
import {SurveySubmissionRepository} from '@/lib/repositories/surveySubmissionRepository';
import {ValueSelectionRepository} from '@/lib/repositories/valueSelectionRepository';

// Mock all repositories
jest.mock('@/lib/repositories/projectRepository');
jest.mock('@/lib/repositories/questionOptionRepository');
jest.mock('@/lib/repositories/surveyAnswerRepository');
jest.mock('@/lib/repositories/surveyQuestionRepository');
jest.mock('@/lib/repositories/surveySubmissionRepository');
jest.mock('@/lib/repositories/selectionOptionRepository');
jest.mock('@/lib/repositories/valueSelectionRepository');

describe('EmployerSurveyService', () => {
  let service: EmployerSurveyService;
  let mockProjectRepository: jest.Mocked<ProjectRepository>;
  let mockQuestionRepository: jest.Mocked<SurveyQuestionRepository>;
  let mockQuestionOptionRepository: jest.Mocked<QuestionOptionRepository>;
  let mockSubmissionRepository: jest.Mocked<SurveySubmissionRepository>;
  let mockAnswerRepository: jest.Mocked<SurveyAnswerRepository>;
  let mockSelectionOptionRepository: jest.Mocked<SelectionOptionRepository>;
  let mockValueSelectionRepository: jest.Mocked<ValueSelectionRepository>;

  beforeEach(() => {
    jest.clearAllMocks();

    // Create mock objects
    mockProjectRepository = {
      updateStatus: jest.fn(),
    };

    mockQuestionRepository = {
      getAllQuestionIds: jest.fn(),
      getQuestionsByIds: jest.fn(),
      getQuestionsByStep: jest.fn(),
    };

    mockQuestionOptionRepository = {
      getOptionsByQuestionKeys: jest.fn(),
    };

    mockSubmissionRepository = {
      findSubmission: jest.fn(),
      getOrCreateEmployerSubmission: jest.fn(),
      markAsSubmitted: jest.fn(),
    };

    mockAnswerRepository = {
      getAnsweredQuestionIds: jest.fn(),
      getAnswersByQuestions: jest.fn(),
      upsertAnswer: jest.fn(),
    };

    mockSelectionOptionRepository = {
      getAllOptions: jest.fn(),
    };

    mockValueSelectionRepository = {
      deleteSelectionsByAnswer: jest.fn(),
      getSelectionsByAnswers: jest.fn(),
      insertSelections: jest.fn(),
    };

    // Mock the repository constructors to return our mocks
    (
      ProjectRepository as jest.MockedClass<typeof ProjectRepository>
    ).mockImplementation(() => mockProjectRepository);
    (
      SurveyQuestionRepository as jest.MockedClass<
        typeof SurveyQuestionRepository
      >
    ).mockImplementation(() => mockQuestionRepository);
    (
      QuestionOptionRepository as jest.MockedClass<
        typeof QuestionOptionRepository
      >
    ).mockImplementation(() => mockQuestionOptionRepository);
    (
      SurveySubmissionRepository as jest.MockedClass<
        typeof SurveySubmissionRepository
      >
    ).mockImplementation(() => mockSubmissionRepository);
    (
      SurveyAnswerRepository as jest.MockedClass<typeof SurveyAnswerRepository>
    ).mockImplementation(() => mockAnswerRepository);
    (
      SelectionOptionRepository as jest.MockedClass<
        typeof SelectionOptionRepository
      >
    ).mockImplementation(() => mockSelectionOptionRepository);
    (
      ValueSelectionRepository as jest.MockedClass<
        typeof ValueSelectionRepository
      >
    ).mockImplementation(() => mockValueSelectionRepository);

    // Create service instance after mocks are set up
    service = new EmployerSurveyService();
  });

  describe('getStepData', () => {
    const mockQuestions = [
      {
        id: 'q1',
        key: 'company_values',
        prompt: 'What are your company values?',
        question_type: 'long_text',
        selection_limit: null,
        step: 2,
        survey_type: 'employer',
      },
      {
        id: 'q2',
        key: 'industry_focus',
        prompt: 'What is your industry focus?',
        question_type: 'single_select',
        selection_limit: null,
        step: 2,
        survey_type: 'employer',
      },
      {
        id: 'q3',
        key: 'benefits',
        prompt: 'Select your benefits',
        question_type: 'multi_select',
        selection_limit: 3,
        step: 2,
        survey_type: 'employer',
      },
    ];

    const mockSubmission = {
      id: 'submission-123',
      project_id: 'project-123',
      status: 'in_progress',
      survey_type: 'employer',
    };

    it('should return step data with no existing answers', async () => {
      mockQuestionRepository.getQuestionsByStep.mockResolvedValue(
        mockQuestions,
      );
      mockSubmissionRepository.getOrCreateEmployerSubmission.mockResolvedValue(
        mockSubmission,
      );
      mockAnswerRepository.getAnswersByQuestions.mockResolvedValue(new Map());
      mockValueSelectionRepository.getSelectionsByAnswers.mockResolvedValue(
        new Map(),
      );
      mockQuestionOptionRepository.getOptionsByQuestionKeys.mockResolvedValue(
        new Map([
          ['industry_focus', [{label: 'Technology', value_key: 'tech'}]],
        ]),
      );
      mockSelectionOptionRepository.getAllOptions.mockResolvedValue([
        {
          key: 'health_insurance',
          label_de: 'Health Insurance',
          option_type: 'value',
        },
        {key: 'remote_work', label_de: 'Remote Work', option_type: 'value'},
      ]);

      const result = await service.getStepData('project-123', 2);

      expect(result.step).toBe(2);
      expect(result.questions).toHaveLength(3);
      expect(result.questions[0]).toEqual({
        answer: null,
        id: 'q1',
        key: 'company_values',
        prompt: 'What are your company values?',
        question_type: 'long_text',
        selection_limit: null,
      });
      expect(result.questions[1]).toEqual({
        answer: null,
        id: 'q2',
        key: 'industry_focus',
        options: [{label: 'Technology', value_key: 'tech'}],
        prompt: 'What is your industry focus?',
        question_type: 'single_select',
        selection_limit: null,
      });
      expect(result.questions[2]).toEqual({
        answer: null,
        id: 'q3',
        key: 'benefits',
        options: [
          {label: 'Health Insurance', value_key: 'health_insurance'},
          {label: 'Remote Work', value_key: 'remote_work'},
        ],
        prompt: 'Select your benefits',
        question_type: 'multi_select',
        selection_limit: 3,
      });
    });

    it('should return step data with existing answers', async () => {
      const mockAnswers = new Map([
        [
          'q1',
          {
            answer_text: 'Innovation and Excellence',
            id: 'a1',
            question_id: 'q1',
          },
        ],
        ['q2', {answer_text: null, id: 'a2', question_id: 'q2'}],
      ]);

      const mockSelections = new Map([['a2', ['tech']]]);

      mockQuestionRepository.getQuestionsByStep.mockResolvedValue(
        mockQuestions,
      );
      mockSubmissionRepository.getOrCreateEmployerSubmission.mockResolvedValue(
        mockSubmission,
      );
      mockAnswerRepository.getAnswersByQuestions.mockResolvedValue(mockAnswers);
      mockValueSelectionRepository.getSelectionsByAnswers.mockResolvedValue(
        mockSelections,
      );
      mockQuestionOptionRepository.getOptionsByQuestionKeys.mockResolvedValue(
        new Map([
          ['industry_focus', [{label: 'Technology', value_key: 'tech'}]],
        ]),
      );
      mockSelectionOptionRepository.getAllOptions.mockResolvedValue([
        {
          key: 'health_insurance',
          label_de: 'Health Insurance',
          option_type: 'value',
        },
      ]);

      const result = await service.getStepData('project-123', 2);

      expect(result.questions[0].answer).toEqual({
        text: 'Innovation and Excellence',
      });
      expect(result.questions[1].answer).toEqual({values: ['tech']});
      expect(result.questions[2].answer).toEqual(null);
    });

    it('should not load multi_select options when no multi_select questions exist', async () => {
      const textOnlyQuestions = [mockQuestions[0]];

      mockQuestionRepository.getQuestionsByStep.mockResolvedValue(
        textOnlyQuestions,
      );
      mockSubmissionRepository.getOrCreateEmployerSubmission.mockResolvedValue(
        mockSubmission,
      );
      mockAnswerRepository.getAnswersByQuestions.mockResolvedValue(new Map());
      mockValueSelectionRepository.getSelectionsByAnswers.mockResolvedValue(
        new Map(),
      );
      mockQuestionOptionRepository.getOptionsByQuestionKeys.mockResolvedValue(
        new Map(),
      );

      await service.getStepData('project-123', 2);

      expect(
        mockSelectionOptionRepository.getAllOptions,
      ).not.toHaveBeenCalled();
    });
  });

  describe('saveStepAnswers', () => {
    const mockSubmission = {
      id: 'submission-123',
      project_id: 'project-123',
      status: 'in_progress',
      survey_type: 'employer',
    };

    beforeEach(() => {
      mockSubmissionRepository.getOrCreateEmployerSubmission.mockResolvedValue(
        mockSubmission,
      );
      mockAnswerRepository.upsertAnswer.mockResolvedValue({id: 'answer-123'});
      mockValueSelectionRepository.deleteSelectionsByAnswer.mockResolvedValue(
        undefined,
      );
      mockValueSelectionRepository.insertSelections.mockResolvedValue(
        undefined,
      );
    });

    describe('text question validation', () => {
      it('should save text answer successfully', async () => {
        const questionsMap = new Map([
          [
            'q1',
            {
              id: 'q1',
              key: 'company_values',
              question_type: 'text',
              selection_limit: null,
              step: 2,
              survey_type: 'employer',
            },
          ],
        ]);

        mockQuestionRepository.getQuestionsByIds.mockResolvedValue(
          questionsMap,
        );

        await service.saveStepAnswers('project-123', 2, [
          {answer_text: 'Innovation', question_id: 'q1'},
        ]);

        expect(mockAnswerRepository.upsertAnswer).toHaveBeenCalledWith(
          'submission-123',
          'q1',
          'Innovation',
        );
        expect(
          mockValueSelectionRepository.deleteSelectionsByAnswer,
        ).not.toHaveBeenCalled();
      });

      it('should throw error when answer_text is missing for text question', async () => {
        const questionsMap = new Map([
          [
            'q1',
            {
              id: 'q1',
              question_type: 'text',
              step: 2,
              survey_type: 'employer',
            },
          ],
        ]);

        mockQuestionRepository.getQuestionsByIds.mockResolvedValue(
          questionsMap,
        );

        await expect(
          service.saveStepAnswers('project-123', 2, [{question_id: 'q1'}]),
        ).rejects.toThrow('answer_text required for question q1');
      });

      it('should throw error when selected_values provided for text question', async () => {
        const questionsMap = new Map([
          [
            'q1',
            {
              id: 'q1',
              question_type: 'text',
              step: 2,
              survey_type: 'employer',
            },
          ],
        ]);

        mockQuestionRepository.getQuestionsByIds.mockResolvedValue(
          questionsMap,
        );

        await expect(
          service.saveStepAnswers('project-123', 2, [
            {
              answer_text: 'Test',
              question_id: 'q1',
              selected_values: ['value1'],
            },
          ]),
        ).rejects.toThrow('selected_values must be empty for text question q1');
      });
    });

    describe('single_select question validation', () => {
      it('should save single_select answer successfully', async () => {
        const questionsMap = new Map([
          [
            'q2',
            {
              id: 'q2',
              question_type: 'single_select',
              selection_limit: null,
              step: 2,
              survey_type: 'employer',
            },
          ],
        ]);

        mockQuestionRepository.getQuestionsByIds.mockResolvedValue(
          questionsMap,
        );

        await service.saveStepAnswers('project-123', 2, [
          {question_id: 'q2', selected_values: ['option1']},
        ]);

        expect(mockAnswerRepository.upsertAnswer).toHaveBeenCalledWith(
          'submission-123',
          'q2',
          null,
        );
        expect(
          mockValueSelectionRepository.deleteSelectionsByAnswer,
        ).toHaveBeenCalledWith('answer-123');
        expect(
          mockValueSelectionRepository.insertSelections,
        ).toHaveBeenCalledWith('answer-123', ['option1']);
      });

      it('should throw error when no value selected for single_select', async () => {
        const questionsMap = new Map([
          [
            'q2',
            {
              id: 'q2',
              question_type: 'single_select',
              step: 2,
              survey_type: 'employer',
            },
          ],
        ]);

        mockQuestionRepository.getQuestionsByIds.mockResolvedValue(
          questionsMap,
        );

        await expect(
          service.saveStepAnswers('project-123', 2, [{question_id: 'q2'}]),
        ).rejects.toThrow(
          'Exactly 1 value required for single_select question q2',
        );
      });

      it('should throw error when multiple values selected for single_select', async () => {
        const questionsMap = new Map([
          [
            'q2',
            {
              id: 'q2',
              question_type: 'single_select',
              step: 2,
              survey_type: 'employer',
            },
          ],
        ]);

        mockQuestionRepository.getQuestionsByIds.mockResolvedValue(
          questionsMap,
        );

        await expect(
          service.saveStepAnswers('project-123', 2, [
            {question_id: 'q2', selected_values: ['option1', 'option2']},
          ]),
        ).rejects.toThrow(
          'Exactly 1 value required for single_select question q2',
        );
      });

      it('should throw error when answer_text provided for single_select', async () => {
        const questionsMap = new Map([
          [
            'q2',
            {
              id: 'q2',
              question_type: 'single_select',
              step: 2,
              survey_type: 'employer',
            },
          ],
        ]);

        mockQuestionRepository.getQuestionsByIds.mockResolvedValue(
          questionsMap,
        );

        await expect(
          service.saveStepAnswers('project-123', 2, [
            {
              answer_text: 'text',
              question_id: 'q2',
              selected_values: ['option1'],
            },
          ]),
        ).rejects.toThrow(
          'answer_text must be empty for single_select question q2',
        );
      });
    });

    describe('multi_select question validation', () => {
      it('should save multi_select answer successfully', async () => {
        const questionsMap = new Map([
          [
            'q3',
            {
              id: 'q3',
              question_type: 'multi_select',
              selection_limit: 3,
              step: 2,
              survey_type: 'employer',
            },
          ],
        ]);

        mockQuestionRepository.getQuestionsByIds.mockResolvedValue(
          questionsMap,
        );

        await service.saveStepAnswers('project-123', 2, [
          {question_id: 'q3', selected_values: ['val1', 'val2']},
        ]);

        expect(mockAnswerRepository.upsertAnswer).toHaveBeenCalledWith(
          'submission-123',
          'q3',
          null,
        );
        expect(
          mockValueSelectionRepository.insertSelections,
        ).toHaveBeenCalledWith('answer-123', ['val1', 'val2']);
      });

      it('should throw error when no values selected for multi_select', async () => {
        const questionsMap = new Map([
          [
            'q3',
            {
              id: 'q3',
              question_type: 'multi_select',
              selection_limit: 3,
              step: 2,
              survey_type: 'employer',
            },
          ],
        ]);

        mockQuestionRepository.getQuestionsByIds.mockResolvedValue(
          questionsMap,
        );

        await expect(
          service.saveStepAnswers('project-123', 2, [{question_id: 'q3'}]),
        ).rejects.toThrow(
          'At least 1 value required for multi_select question q3',
        );
      });

      it('should throw error when too many values selected for multi_select', async () => {
        const questionsMap = new Map([
          [
            'q3',
            {
              id: 'q3',
              question_type: 'multi_select',
              selection_limit: 2,
              step: 2,
              survey_type: 'employer',
            },
          ],
        ]);

        mockQuestionRepository.getQuestionsByIds.mockResolvedValue(
          questionsMap,
        );

        await expect(
          service.saveStepAnswers('project-123', 2, [
            {question_id: 'q3', selected_values: ['val1', 'val2', 'val3']},
          ]),
        ).rejects.toThrow(
          'Too many values for multi_select question q3 (limit: 2)',
        );
      });

      it('should allow multiple values when selection_limit is null', async () => {
        const questionsMap = new Map([
          [
            'q3',
            {
              id: 'q3',
              question_type: 'multi_select',
              selection_limit: null,
              step: 2,
              survey_type: 'employer',
            },
          ],
        ]);

        mockQuestionRepository.getQuestionsByIds.mockResolvedValue(
          questionsMap,
        );

        await service.saveStepAnswers('project-123', 2, [
          {
            question_id: 'q3',
            selected_values: ['val1', 'val2', 'val3', 'val4'],
          },
        ]);

        expect(
          mockValueSelectionRepository.insertSelections,
        ).toHaveBeenCalledWith('answer-123', ['val1', 'val2', 'val3', 'val4']);
      });
    });

    describe('question validation', () => {
      it('should throw error when question not found', async () => {
        mockQuestionRepository.getQuestionsByIds.mockResolvedValue(new Map());

        await expect(
          service.saveStepAnswers('project-123', 2, [
            {answer_text: 'test', question_id: 'nonexistent'},
          ]),
        ).rejects.toThrow('Question not found: nonexistent');
      });

      it('should throw error when question does not belong to step', async () => {
        const questionsMap = new Map([
          [
            'q1',
            {
              id: 'q1',
              question_type: 'text',
              step: 3,
              survey_type: 'employer',
            },
          ],
        ]);

        mockQuestionRepository.getQuestionsByIds.mockResolvedValue(
          questionsMap,
        );

        await expect(
          service.saveStepAnswers('project-123', 2, [
            {answer_text: 'test', question_id: 'q1'},
          ]),
        ).rejects.toThrow('Question does not belong to step 2');
      });

      it('should throw error when question is not an employer question', async () => {
        const questionsMap = new Map([
          [
            'q1',
            {
              id: 'q1',
              question_type: 'text',
              step: 2,
              survey_type: 'employee',
            },
          ],
        ]);

        mockQuestionRepository.getQuestionsByIds.mockResolvedValue(
          questionsMap,
        );

        await expect(
          service.saveStepAnswers('project-123', 2, [
            {answer_text: 'test', question_id: 'q1'},
          ]),
        ).rejects.toThrow('Question is not an employer question');
      });
    });

    it('should process multiple answers in sequence', async () => {
      const questionsMap = new Map([
        [
          'q1',
          {
            id: 'q1',
            question_type: 'text',
            step: 2,
            survey_type: 'employer',
          },
        ],
        [
          'q2',
          {
            id: 'q2',
            question_type: 'single_select',
            step: 2,
            survey_type: 'employer',
          },
        ],
      ]);

      mockQuestionRepository.getQuestionsByIds.mockResolvedValue(questionsMap);

      await service.saveStepAnswers('project-123', 2, [
        {answer_text: 'Answer 1', question_id: 'q1'},
        {question_id: 'q2', selected_values: ['option1']},
      ]);

      expect(mockAnswerRepository.upsertAnswer).toHaveBeenCalledTimes(2);
    });
  });

  describe('completeEmployerSurvey', () => {
    it('should complete survey successfully when all requirements met', async () => {
      const mockSubmission = {
        id: 'submission-123',
        status: 'in_progress',
      };

      mockSubmissionRepository.findSubmission.mockResolvedValue(mockSubmission);
      mockQuestionRepository.getAllQuestionIds.mockResolvedValue([
        'q1',
        'q2',
        'q3',
      ]);
      mockAnswerRepository.getAnsweredQuestionIds.mockResolvedValue([
        'q1',
        'q2',
        'q3',
      ]);
      mockSubmissionRepository.markAsSubmitted.mockResolvedValue(undefined);
      mockProjectRepository.updateStatus.mockResolvedValue(undefined);

      await service.completeEmployerSurvey(
        'project-123',
        'employer_survey_in_progress',
      );

      expect(mockSubmissionRepository.markAsSubmitted).toHaveBeenCalledWith(
        'submission-123',
      );
      expect(mockProjectRepository.updateStatus).toHaveBeenCalledWith(
        'project-123',
        'employer_survey_completed',
      );
    });

    it('should throw error when project state is invalid', async () => {
      await expect(
        service.completeEmployerSurvey('project-123', 'completed'),
      ).rejects.toThrow('invalid_project_state');

      expect(mockSubmissionRepository.findSubmission).not.toHaveBeenCalled();
    });

    it('should throw error when no submission found', async () => {
      mockSubmissionRepository.findSubmission.mockResolvedValue(null);

      await expect(
        service.completeEmployerSurvey(
          'project-123',
          'employer_survey_in_progress',
        ),
      ).rejects.toThrow('no_submission_found');
    });

    it('should throw error when submission already completed', async () => {
      const mockSubmission = {
        id: 'submission-123',
        status: 'submitted',
      };

      mockSubmissionRepository.findSubmission.mockResolvedValue(mockSubmission);

      await expect(
        service.completeEmployerSurvey(
          'project-123',
          'employer_survey_in_progress',
        ),
      ).rejects.toThrow('already_completed');
    });

    it('should throw error with missing question IDs when questions not answered', async () => {
      const mockSubmission = {
        id: 'submission-123',
        status: 'in_progress',
      };

      mockSubmissionRepository.findSubmission.mockResolvedValue(mockSubmission);
      mockQuestionRepository.getAllQuestionIds.mockResolvedValue([
        'q1',
        'q2',
        'q3',
      ]);
      mockAnswerRepository.getAnsweredQuestionIds.mockResolvedValue(['q1']);

      await expect(
        service.completeEmployerSurvey(
          'project-123',
          'employer_survey_in_progress',
        ),
      ).rejects.toThrow('missing_required_questions');

      try {
        await service.completeEmployerSurvey(
          'project-123',
          'employer_survey_in_progress',
        );
      } catch (error: unknown) {
        expect(
          (error as Error & {missing_question_ids?: string[]})
            .missing_question_ids,
        ).toEqual(['q2', 'q3']);
      }
    });

    it('should handle database errors during completion', async () => {
      const mockSubmission = {
        id: 'submission-123',
        status: 'in_progress',
      };

      mockSubmissionRepository.findSubmission.mockResolvedValue(mockSubmission);
      mockQuestionRepository.getAllQuestionIds.mockResolvedValue(['q1']);
      mockAnswerRepository.getAnsweredQuestionIds.mockResolvedValue(['q1']);
      mockSubmissionRepository.markAsSubmitted.mockRejectedValue(
        new Error('Database error'),
      );

      await expect(
        service.completeEmployerSurvey(
          'project-123',
          'employer_survey_in_progress',
        ),
      ).rejects.toThrow('Failed to complete survey: Database error');
    });

    it('should handle project update errors during completion', async () => {
      const mockSubmission = {
        id: 'submission-123',
        status: 'in_progress',
      };

      mockSubmissionRepository.findSubmission.mockResolvedValue(mockSubmission);
      mockQuestionRepository.getAllQuestionIds.mockResolvedValue(['q1']);
      mockAnswerRepository.getAnsweredQuestionIds.mockResolvedValue(['q1']);
      mockSubmissionRepository.markAsSubmitted.mockResolvedValue(undefined);
      mockProjectRepository.updateStatus.mockRejectedValue(
        new Error('Update failed'),
      );

      await expect(
        service.completeEmployerSurvey(
          'project-123',
          'employer_survey_in_progress',
        ),
      ).rejects.toThrow('Failed to complete survey: Update failed');
    });
  });
});

describe('EmployerSurveyService', () => {
  let service: EmployerSurveyService;
  let mockProjectRepository: jest.Mocked<ProjectRepository>;
  let mockQuestionRepository: jest.Mocked<SurveyQuestionRepository>;
  let mockQuestionOptionRepository: jest.Mocked<QuestionOptionRepository>;
  let mockSubmissionRepository: jest.Mocked<SurveySubmissionRepository>;
  let mockAnswerRepository: jest.Mocked<SurveyAnswerRepository>;
  let mockSelectionOptionRepository: jest.Mocked<SelectionOptionRepository>;
  let mockValueSelectionRepository: jest.Mocked<ValueSelectionRepository>;

  beforeEach(() => {
    jest.clearAllMocks();

    // Create mock objects
    mockProjectRepository = {
      updateStatus: jest.fn(),
    };

    mockQuestionRepository = {
      getAllQuestionIds: jest.fn(),
      getQuestionsByIds: jest.fn(),
      getQuestionsByStep: jest.fn(),
    };

    mockQuestionOptionRepository = {
      getOptionsByQuestionKeys: jest.fn(),
    };

    mockSubmissionRepository = {
      findSubmission: jest.fn(),
      getOrCreateEmployerSubmission: jest.fn(),
      markAsSubmitted: jest.fn(),
    };

    mockAnswerRepository = {
      getAnsweredQuestionIds: jest.fn(),
      getAnswersByQuestions: jest.fn(),
      upsertAnswer: jest.fn(),
    };

    mockSelectionOptionRepository = {
      getAllOptions: jest.fn(),
    };

    mockValueSelectionRepository = {
      deleteSelectionsByAnswer: jest.fn(),
      getSelectionsByAnswers: jest.fn(),
      insertSelections: jest.fn(),
    };

    // Mock the repository constructors to return our mocks
    (
      ProjectRepository as jest.MockedClass<typeof ProjectRepository>
    ).mockImplementation(() => mockProjectRepository);
    (
      SurveyQuestionRepository as jest.MockedClass<
        typeof SurveyQuestionRepository
      >
    ).mockImplementation(() => mockQuestionRepository);
    (
      QuestionOptionRepository as jest.MockedClass<
        typeof QuestionOptionRepository
      >
    ).mockImplementation(() => mockQuestionOptionRepository);
    (
      SurveySubmissionRepository as jest.MockedClass<
        typeof SurveySubmissionRepository
      >
    ).mockImplementation(() => mockSubmissionRepository);
    (
      SurveyAnswerRepository as jest.MockedClass<typeof SurveyAnswerRepository>
    ).mockImplementation(() => mockAnswerRepository);
    (
      SelectionOptionRepository as jest.MockedClass<
        typeof SelectionOptionRepository
      >
    ).mockImplementation(() => mockSelectionOptionRepository);
    (
      ValueSelectionRepository as jest.MockedClass<
        typeof ValueSelectionRepository
      >
    ).mockImplementation(() => mockValueSelectionRepository);

    // Create service instance after mocks are set up
    service = new EmployerSurveyService();
  });

  describe('getStepData', () => {
    const mockQuestions = [
      {
        id: 'q1',
        key: 'company_values',
        prompt: 'What are your company values?',
        question_type: 'long_text',
        selection_limit: null,
        step: 2,
        survey_type: 'employer',
      },
      {
        id: 'q2',
        key: 'industry_focus',
        prompt: 'What is your industry focus?',
        question_type: 'single_select',
        selection_limit: null,
        step: 2,
        survey_type: 'employer',
      },
      {
        id: 'q3',
        key: 'benefits',
        prompt: 'Select your benefits',
        question_type: 'multi_select',
        selection_limit: 3,
        step: 2,
        survey_type: 'employer',
      },
    ];

    const mockSubmission = {
      id: 'submission-123',
      project_id: 'project-123',
      status: 'in_progress',
      survey_type: 'employer',
    };

    it('should return step data with no existing answers', async () => {
      mockQuestionRepository.getQuestionsByStep.mockResolvedValue(
        mockQuestions,
      );
      mockSubmissionRepository.getOrCreateEmployerSubmission.mockResolvedValue(
        mockSubmission,
      );
      mockAnswerRepository.getAnswersByQuestions.mockResolvedValue(new Map());
      mockValueSelectionRepository.getSelectionsByAnswers.mockResolvedValue(
        new Map(),
      );
      mockQuestionOptionRepository.getOptionsByQuestionKeys.mockResolvedValue(
        new Map([
          ['industry_focus', [{label: 'Technology', value_key: 'tech'}]],
        ]),
      );
      mockSelectionOptionRepository.getAllOptions.mockResolvedValue([
        {
          key: 'health_insurance',
          label_de: 'Health Insurance',
          option_type: 'value',
        },
        {key: 'remote_work', label_de: 'Remote Work', option_type: 'value'},
      ]);

      const result = await service.getStepData('project-123', 2);

      expect(result.step).toBe(2);
      expect(result.questions).toHaveLength(3);
      expect(result.questions[0]).toEqual({
        answer: null,
        id: 'q1',
        key: 'company_values',
        prompt: 'What are your company values?',
        question_type: 'long_text',
        selection_limit: null,
      });
      expect(result.questions[1]).toEqual({
        answer: null,
        id: 'q2',
        key: 'industry_focus',
        options: [{label: 'Technology', value_key: 'tech'}],
        prompt: 'What is your industry focus?',
        question_type: 'single_select',
        selection_limit: null,
      });
      expect(result.questions[2]).toEqual({
        answer: null,
        id: 'q3',
        key: 'benefits',
        options: [
          {label: 'Health Insurance', value_key: 'health_insurance'},
          {label: 'Remote Work', value_key: 'remote_work'},
        ],
        prompt: 'Select your benefits',
        question_type: 'multi_select',
        selection_limit: 3,
      });
    });

    it('should return step data with existing answers', async () => {
      const mockAnswers = new Map([
        [
          'q1',
          {
            answer_text: 'Innovation and Excellence',
            id: 'a1',
            question_id: 'q1',
          },
        ],
        ['q2', {answer_text: null, id: 'a2', question_id: 'q2'}],
      ]);

      const mockSelections = new Map([['a2', ['tech']]]);

      mockQuestionRepository.getQuestionsByStep.mockResolvedValue(
        mockQuestions,
      );
      mockSubmissionRepository.getOrCreateEmployerSubmission.mockResolvedValue(
        mockSubmission,
      );
      mockAnswerRepository.getAnswersByQuestions.mockResolvedValue(mockAnswers);
      mockValueSelectionRepository.getSelectionsByAnswers.mockResolvedValue(
        mockSelections,
      );
      mockQuestionOptionRepository.getOptionsByQuestionKeys.mockResolvedValue(
        new Map([
          ['industry_focus', [{label: 'Technology', value_key: 'tech'}]],
        ]),
      );
      mockSelectionOptionRepository.getAllOptions.mockResolvedValue([
        {
          key: 'health_insurance',
          label_de: 'Health Insurance',
          option_type: 'value',
        },
      ]);

      const result = await service.getStepData('project-123', 2);

      expect(result.questions[0].answer).toEqual({
        text: 'Innovation and Excellence',
      });
      expect(result.questions[1].answer).toEqual({values: ['tech']});
      expect(result.questions[2].answer).toEqual(null);
    });

    it('should not load multi_select options when no multi_select questions exist', async () => {
      const textOnlyQuestions = [mockQuestions[0]];

      mockQuestionRepository.getQuestionsByStep.mockResolvedValue(
        textOnlyQuestions,
      );
      mockSubmissionRepository.getOrCreateEmployerSubmission.mockResolvedValue(
        mockSubmission,
      );
      mockAnswerRepository.getAnswersByQuestions.mockResolvedValue(new Map());
      mockValueSelectionRepository.getSelectionsByAnswers.mockResolvedValue(
        new Map(),
      );
      mockQuestionOptionRepository.getOptionsByQuestionKeys.mockResolvedValue(
        new Map(),
      );

      await service.getStepData('project-123', 2);

      expect(
        mockSelectionOptionRepository.getAllOptions,
      ).not.toHaveBeenCalled();
    });
  });

  describe('saveStepAnswers', () => {
    const mockSubmission = {
      id: 'submission-123',
      project_id: 'project-123',
      status: 'in_progress',
      survey_type: 'employer',
    };

    beforeEach(() => {
      mockSubmissionRepository.getOrCreateEmployerSubmission.mockResolvedValue(
        mockSubmission,
      );
      mockAnswerRepository.upsertAnswer.mockResolvedValue({id: 'answer-123'});
      mockValueSelectionRepository.deleteSelectionsByAnswer.mockResolvedValue(
        undefined,
      );
      mockValueSelectionRepository.insertSelections.mockResolvedValue(
        undefined,
      );
    });

    describe('text question validation', () => {
      it('should save text answer successfully', async () => {
        const questionsMap = new Map([
          [
            'q1',
            {
              id: 'q1',
              key: 'company_values',
              question_type: 'text',
              selection_limit: null,
              step: 2,
              survey_type: 'employer',
            },
          ],
        ]);

        mockQuestionRepository.getQuestionsByIds.mockResolvedValue(
          questionsMap,
        );

        await service.saveStepAnswers('project-123', 2, [
          {answer_text: 'Innovation', question_id: 'q1'},
        ]);

        expect(mockAnswerRepository.upsertAnswer).toHaveBeenCalledWith(
          'submission-123',
          'q1',
          'Innovation',
        );
        expect(
          mockValueSelectionRepository.deleteSelectionsByAnswer,
        ).not.toHaveBeenCalled();
      });

      it('should throw error when answer_text is missing for text question', async () => {
        const questionsMap = new Map([
          [
            'q1',
            {
              id: 'q1',
              question_type: 'text',
              step: 2,
              survey_type: 'employer',
            },
          ],
        ]);

        mockQuestionRepository.getQuestionsByIds = jest
          .fn()
          .mockResolvedValue(questionsMap);

        await expect(
          service.saveStepAnswers('project-123', 2, [{question_id: 'q1'}]),
        ).rejects.toThrow('answer_text required for question q1');
      });

      it('should throw error when selected_values provided for text question', async () => {
        const questionsMap = new Map([
          [
            'q1',
            {
              id: 'q1',
              question_type: 'text',
              step: 2,
              survey_type: 'employer',
            },
          ],
        ]);

        mockQuestionRepository.getQuestionsByIds = jest
          .fn()
          .mockResolvedValue(questionsMap);

        await expect(
          service.saveStepAnswers('project-123', 2, [
            {
              answer_text: 'Test',
              question_id: 'q1',
              selected_values: ['value1'],
            },
          ]),
        ).rejects.toThrow('selected_values must be empty for text question q1');
      });
    });

    describe('single_select question validation', () => {
      it('should save single_select answer successfully', async () => {
        const questionsMap = new Map([
          [
            'q2',
            {
              id: 'q2',
              question_type: 'single_select',
              selection_limit: null,
              step: 2,
              survey_type: 'employer',
            },
          ],
        ]);

        mockQuestionRepository.getQuestionsByIds = jest
          .fn()
          .mockResolvedValue(questionsMap);

        await service.saveStepAnswers('project-123', 2, [
          {question_id: 'q2', selected_values: ['option1']},
        ]);

        expect(mockAnswerRepository.upsertAnswer).toHaveBeenCalledWith(
          'submission-123',
          'q2',
          null,
        );
        expect(
          mockValueSelectionRepository.deleteSelectionsByAnswer,
        ).toHaveBeenCalledWith('answer-123');
        expect(
          mockValueSelectionRepository.insertSelections,
        ).toHaveBeenCalledWith('answer-123', ['option1']);
      });

      it('should throw error when no value selected for single_select', async () => {
        const questionsMap = new Map([
          [
            'q2',
            {
              id: 'q2',
              question_type: 'single_select',
              step: 2,
              survey_type: 'employer',
            },
          ],
        ]);

        mockQuestionRepository.getQuestionsByIds = jest
          .fn()
          .mockResolvedValue(questionsMap);

        await expect(
          service.saveStepAnswers('project-123', 2, [{question_id: 'q2'}]),
        ).rejects.toThrow(
          'Exactly 1 value required for single_select question q2',
        );
      });

      it('should throw error when multiple values selected for single_select', async () => {
        const questionsMap = new Map([
          [
            'q2',
            {
              id: 'q2',
              question_type: 'single_select',
              step: 2,
              survey_type: 'employer',
            },
          ],
        ]);

        mockQuestionRepository.getQuestionsByIds = jest
          .fn()
          .mockResolvedValue(questionsMap);

        await expect(
          service.saveStepAnswers('project-123', 2, [
            {question_id: 'q2', selected_values: ['option1', 'option2']},
          ]),
        ).rejects.toThrow(
          'Exactly 1 value required for single_select question q2',
        );
      });

      it('should throw error when answer_text provided for single_select', async () => {
        const questionsMap = new Map([
          [
            'q2',
            {
              id: 'q2',
              question_type: 'single_select',
              step: 2,
              survey_type: 'employer',
            },
          ],
        ]);

        mockQuestionRepository.getQuestionsByIds = jest
          .fn()
          .mockResolvedValue(questionsMap);

        await expect(
          service.saveStepAnswers('project-123', 2, [
            {
              answer_text: 'text',
              question_id: 'q2',
              selected_values: ['option1'],
            },
          ]),
        ).rejects.toThrow(
          'answer_text must be empty for single_select question q2',
        );
      });
    });

    describe('multi_select question validation', () => {
      it('should save multi_select answer successfully', async () => {
        const questionsMap = new Map([
          [
            'q3',
            {
              id: 'q3',
              question_type: 'multi_select',
              selection_limit: 3,
              step: 2,
              survey_type: 'employer',
            },
          ],
        ]);

        mockQuestionRepository.getQuestionsByIds = jest
          .fn()
          .mockResolvedValue(questionsMap);

        await service.saveStepAnswers('project-123', 2, [
          {question_id: 'q3', selected_values: ['val1', 'val2']},
        ]);

        expect(mockAnswerRepository.upsertAnswer).toHaveBeenCalledWith(
          'submission-123',
          'q3',
          null,
        );
        expect(
          mockValueSelectionRepository.insertSelections,
        ).toHaveBeenCalledWith('answer-123', ['val1', 'val2']);
      });

      it('should throw error when no values selected for multi_select', async () => {
        const questionsMap = new Map([
          [
            'q3',
            {
              id: 'q3',
              question_type: 'multi_select',
              selection_limit: 3,
              step: 2,
              survey_type: 'employer',
            },
          ],
        ]);

        mockQuestionRepository.getQuestionsByIds = jest
          .fn()
          .mockResolvedValue(questionsMap);

        await expect(
          service.saveStepAnswers('project-123', 2, [{question_id: 'q3'}]),
        ).rejects.toThrow(
          'At least 1 value required for multi_select question q3',
        );
      });

      it('should throw error when too many values selected for multi_select', async () => {
        const questionsMap = new Map([
          [
            'q3',
            {
              id: 'q3',
              question_type: 'multi_select',
              selection_limit: 2,
              step: 2,
              survey_type: 'employer',
            },
          ],
        ]);

        mockQuestionRepository.getQuestionsByIds = jest
          .fn()
          .mockResolvedValue(questionsMap);

        await expect(
          service.saveStepAnswers('project-123', 2, [
            {question_id: 'q3', selected_values: ['val1', 'val2', 'val3']},
          ]),
        ).rejects.toThrow(
          'Too many values for multi_select question q3 (limit: 2)',
        );
      });

      it('should allow multiple values when selection_limit is null', async () => {
        const questionsMap = new Map([
          [
            'q3',
            {
              id: 'q3',
              question_type: 'multi_select',
              selection_limit: null,
              step: 2,
              survey_type: 'employer',
            },
          ],
        ]);

        mockQuestionRepository.getQuestionsByIds = jest
          .fn()
          .mockResolvedValue(questionsMap);

        await service.saveStepAnswers('project-123', 2, [
          {
            question_id: 'q3',
            selected_values: ['val1', 'val2', 'val3', 'val4'],
          },
        ]);

        expect(
          mockValueSelectionRepository.insertSelections,
        ).toHaveBeenCalledWith('answer-123', ['val1', 'val2', 'val3', 'val4']);
      });
    });

    describe('question validation', () => {
      it('should throw error when question not found', async () => {
        mockQuestionRepository.getQuestionsByIds = jest
          .fn()
          .mockResolvedValue(new Map());

        await expect(
          service.saveStepAnswers('project-123', 2, [
            {answer_text: 'test', question_id: 'nonexistent'},
          ]),
        ).rejects.toThrow('Question not found: nonexistent');
      });

      it('should throw error when question does not belong to step', async () => {
        const questionsMap = new Map([
          [
            'q1',
            {
              id: 'q1',
              question_type: 'text',
              step: 3,
              survey_type: 'employer',
            },
          ],
        ]);

        mockQuestionRepository.getQuestionsByIds = jest
          .fn()
          .mockResolvedValue(questionsMap);

        await expect(
          service.saveStepAnswers('project-123', 2, [
            {answer_text: 'test', question_id: 'q1'},
          ]),
        ).rejects.toThrow('Question does not belong to step 2');
      });

      it('should throw error when question is not an employer question', async () => {
        const questionsMap = new Map([
          [
            'q1',
            {
              id: 'q1',
              question_type: 'text',
              step: 2,
              survey_type: 'employee',
            },
          ],
        ]);

        mockQuestionRepository.getQuestionsByIds = jest
          .fn()
          .mockResolvedValue(questionsMap);

        await expect(
          service.saveStepAnswers('project-123', 2, [
            {answer_text: 'test', question_id: 'q1'},
          ]),
        ).rejects.toThrow('Question is not an employer question');
      });
    });

    it('should process multiple answers in sequence', async () => {
      const questionsMap = new Map([
        [
          'q1',
          {
            id: 'q1',
            question_type: 'text',
            step: 2,
            survey_type: 'employer',
          },
        ],
        [
          'q2',
          {
            id: 'q2',
            question_type: 'single_select',
            step: 2,
            survey_type: 'employer',
          },
        ],
      ]);

      mockQuestionRepository.getQuestionsByIds = jest
        .fn()
        .mockResolvedValue(questionsMap);

      await service.saveStepAnswers('project-123', 2, [
        {answer_text: 'Answer 1', question_id: 'q1'},
        {question_id: 'q2', selected_values: ['option1']},
      ]);

      expect(mockAnswerRepository.upsertAnswer).toHaveBeenCalledTimes(2);
    });
  });

  describe('completeEmployerSurvey', () => {
    it('should complete survey successfully when all requirements met', async () => {
      const mockSubmission = {
        id: 'submission-123',
        status: 'in_progress',
      };

      mockSubmissionRepository.findSubmission = jest
        .fn()
        .mockResolvedValue(mockSubmission);
      mockQuestionRepository.getAllQuestionIds = jest
        .fn()
        .mockResolvedValue(['q1', 'q2', 'q3']);
      mockAnswerRepository.getAnsweredQuestionIds = jest
        .fn()
        .mockResolvedValue(['q1', 'q2', 'q3']);
      mockSubmissionRepository.markAsSubmitted = jest
        .fn()
        .mockResolvedValue(undefined);
      mockProjectRepository.updateStatus = jest
        .fn()
        .mockResolvedValue(undefined);

      await service.completeEmployerSurvey(
        'project-123',
        'employer_survey_in_progress',
      );

      expect(mockSubmissionRepository.markAsSubmitted).toHaveBeenCalledWith(
        'submission-123',
      );
      expect(mockProjectRepository.updateStatus).toHaveBeenCalledWith(
        'project-123',
        'employer_survey_completed',
      );
    });

    it('should throw error when project state is invalid', async () => {
      await expect(
        service.completeEmployerSurvey('project-123', 'completed'),
      ).rejects.toThrow('invalid_project_state');

      expect(mockSubmissionRepository.findSubmission).not.toHaveBeenCalled();
    });

    it('should throw error when no submission found', async () => {
      mockSubmissionRepository.findSubmission = jest
        .fn()
        .mockResolvedValue(null);

      await expect(
        service.completeEmployerSurvey(
          'project-123',
          'employer_survey_in_progress',
        ),
      ).rejects.toThrow('no_submission_found');
    });

    it('should throw error when submission already completed', async () => {
      const mockSubmission = {
        id: 'submission-123',
        status: 'submitted',
      };

      mockSubmissionRepository.findSubmission = jest
        .fn()
        .mockResolvedValue(mockSubmission);

      await expect(
        service.completeEmployerSurvey(
          'project-123',
          'employer_survey_in_progress',
        ),
      ).rejects.toThrow('already_completed');
    });

    it('should throw error with missing question IDs when questions not answered', async () => {
      const mockSubmission = {
        id: 'submission-123',
        status: 'in_progress',
      };

      mockSubmissionRepository.findSubmission = jest
        .fn()
        .mockResolvedValue(mockSubmission);
      mockQuestionRepository.getAllQuestionIds = jest
        .fn()
        .mockResolvedValue(['q1', 'q2', 'q3']);
      mockAnswerRepository.getAnsweredQuestionIds = jest
        .fn()
        .mockResolvedValue(['q1']);

      await expect(
        service.completeEmployerSurvey(
          'project-123',
          'employer_survey_in_progress',
        ),
      ).rejects.toThrow('missing_required_questions');

      try {
        await service.completeEmployerSurvey(
          'project-123',
          'employer_survey_in_progress',
        );
      } catch (error: unknown) {
        expect(
          (error as Error & {missing_question_ids?: string[]})
            .missing_question_ids,
        ).toEqual(['q2', 'q3']);
      }
    });

    it('should handle database errors during completion', async () => {
      const mockSubmission = {
        id: 'submission-123',
        status: 'in_progress',
      };

      mockSubmissionRepository.findSubmission = jest
        .fn()
        .mockResolvedValue(mockSubmission);
      mockQuestionRepository.getAllQuestionIds = jest
        .fn()
        .mockResolvedValue(['q1']);
      mockAnswerRepository.getAnsweredQuestionIds = jest
        .fn()
        .mockResolvedValue(['q1']);
      mockSubmissionRepository.markAsSubmitted = jest
        .fn()
        .mockRejectedValue(new Error('Database error'));

      await expect(
        service.completeEmployerSurvey(
          'project-123',
          'employer_survey_in_progress',
        ),
      ).rejects.toThrow('Failed to complete survey: Database error');
    });

    it('should handle project update errors during completion', async () => {
      const mockSubmission = {
        id: 'submission-123',
        status: 'in_progress',
      };

      mockSubmissionRepository.findSubmission = jest
        .fn()
        .mockResolvedValue(mockSubmission);
      mockQuestionRepository.getAllQuestionIds = jest
        .fn()
        .mockResolvedValue(['q1']);
      mockAnswerRepository.getAnsweredQuestionIds = jest
        .fn()
        .mockResolvedValue(['q1']);
      mockSubmissionRepository.markAsSubmitted = jest
        .fn()
        .mockResolvedValue(undefined);
      mockProjectRepository.updateStatus = jest
        .fn()
        .mockRejectedValue(new Error('Update failed'));

      await expect(
        service.completeEmployerSurvey(
          'project-123',
          'employer_survey_in_progress',
        ),
      ).rejects.toThrow('Failed to complete survey: Update failed');
    });
  });
});
