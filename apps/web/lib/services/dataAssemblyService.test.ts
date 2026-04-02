/**
 * @jest-environment node
 */
/* eslint-disable sort-keys */
import DataAssemblyService, {
  MINIMUM_EMPLOYEE_SUBMISSIONS,
} from './dataAssemblyService';

import {AiResultRepository} from '@/lib/repositories/aiResultRepository';
import {ProjectRepository} from '@/lib/repositories/projectRepository';
import {QuestionOptionRepository} from '@/lib/repositories/questionOptionRepository';
import {SelectionOptionRepository} from '@/lib/repositories/selectionOptionRepository';
import {SurveyAnswerRepository} from '@/lib/repositories/surveyAnswerRepository';
import {SurveySubmissionRepository} from '@/lib/repositories/surveySubmissionRepository';
import {ValueSelectionRepository} from '@/lib/repositories/valueSelectionRepository';
import {supabase} from '@/lib/supabase';

jest.mock('@/lib/repositories/aiResultRepository');
jest.mock('@/lib/repositories/projectRepository');
jest.mock('@/lib/repositories/questionOptionRepository');
jest.mock('@/lib/repositories/selectionOptionRepository');
jest.mock('@/lib/repositories/surveyAnswerRepository');
jest.mock('@/lib/repositories/surveySubmissionRepository');
jest.mock('@/lib/repositories/valueSelectionRepository');
jest.mock('@/lib/supabase', () => ({
  supabase: {from: jest.fn()},
}));

const PROJECT_ID = 'proj-0000-0000-0000-000000000001';

function makeProject(overrides = {}) {
  return {
    admin_token: 'tok',
    admin_token_created_at: '2026-01-01',
    company_name: 'Test Corp',
    created_at: '2026-01-01',
    employee_count: '100-500',
    id: PROJECT_ID,
    industry: null as number | null,
    location: 'Munich',
    profile_image_url: null,
    profile_url: 'https://kununu.com/test',
    profile_uuid: null,
    status: 'evp_generation_available',
    survey_token: 'stok',
    survey_token_created_at: '2026-01-01',
    updated_at: '2026-01-01',
    ...overrides,
  };
}

function makeSubmission(
  id: string,
  surveyType: 'employer' | 'employee',
  status: 'submitted' | 'in_progress' = 'submitted',
) {
  return {
    id,
    project_id: PROJECT_ID,
    respondent_meta: {},
    started_at: '2026-01-01T00:00:00Z',
    status,
    submitted_at: status === 'submitted' ? '2026-01-02T00:00:00Z' : null,
    survey_type: surveyType,
  };
}

interface AnswerRow {
  answer_json: null;
  answer_text: string | null;
  created_at: string;
  id: string;
  question: {key: string; prompt: string; question_type: string};
  question_id: string;
  submission_id: string;
  updated_at: string;
}

function makeAnswerRow(
  id: string,
  submissionId: string,
  questionKey: string,
  questionType: string,
  answerText: string | null = null,
): AnswerRow {
  return {
    answer_json: null,
    answer_text: answerText,
    created_at: '2026-01-01T00:00:00Z',
    id,
    question: {
      key: questionKey,
      prompt: `Prompt for ${questionKey}`,
      question_type: questionType,
    },
    question_id: `q-${questionKey}`,
    submission_id: submissionId,
    updated_at: '2026-01-01T00:00:00Z',
  };
}

describe('DataAssemblyService', () => {
  let service: DataAssemblyService;
  let mockAiResultRepo: jest.Mocked<AiResultRepository>;
  let mockProjectRepo: jest.Mocked<ProjectRepository>;
  let mockAnswerRepo: jest.Mocked<SurveyAnswerRepository>;
  let mockSubmissionRepo: jest.Mocked<SurveySubmissionRepository>;
  let mockValueSelectionRepo: jest.Mocked<ValueSelectionRepository>;
  let mockQuestionOptionRepo: jest.Mocked<QuestionOptionRepository>;
  let mockSelectionOptionRepo: jest.Mocked<SelectionOptionRepository>;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new DataAssemblyService();

    mockAiResultRepo = jest.mocked(
      (AiResultRepository as jest.MockedClass<typeof AiResultRepository>).mock
        .instances[0],
    );
    mockProjectRepo = jest.mocked(
      (ProjectRepository as jest.MockedClass<typeof ProjectRepository>).mock
        .instances[0],
    );
    mockAnswerRepo = jest.mocked(
      (
        SurveyAnswerRepository as jest.MockedClass<
          typeof SurveyAnswerRepository
        >
      ).mock.instances[0],
    );
    mockSubmissionRepo = jest.mocked(
      (
        SurveySubmissionRepository as jest.MockedClass<
          typeof SurveySubmissionRepository
        >
      ).mock.instances[0],
    );
    mockValueSelectionRepo = jest.mocked(
      (
        ValueSelectionRepository as jest.MockedClass<
          typeof ValueSelectionRepository
        >
      ).mock.instances[0],
    );
    mockQuestionOptionRepo = jest.mocked(
      (
        QuestionOptionRepository as jest.MockedClass<
          typeof QuestionOptionRepository
        >
      ).mock.instances[0],
    );
    mockSelectionOptionRepo = jest.mocked(
      (
        SelectionOptionRepository as jest.MockedClass<
          typeof SelectionOptionRepository
        >
      ).mock.instances[0],
    );

    // Default industry mock (no industry)
    const mockMaybeSingle = jest
      .fn()
      .mockResolvedValue({data: null, error: null});
    const mockEq = jest.fn().mockReturnValue({maybeSingle: mockMaybeSingle});
    const mockSelect = jest.fn().mockReturnValue({eq: mockEq});

    (supabase.from as jest.Mock).mockReturnValue({select: mockSelect});

    // Default AI result save
    mockAiResultRepo.save.mockResolvedValue({
      generated_at: '2026-01-01T00:00:00Z',
      id: 'result-1',
      input_snapshot: {},
      model_used: 'data_assembly',
      pipeline_step: 'assembly',
      project_id: PROJECT_ID,
      result_json: null,
      result_text: null,
      target_audience: null,
    });
  });

  /** Helper: set up a minimal happy-path with N submitted employee submissions */
  function setupHappyPath(
    employeeCount = 3,
    answerRows: AnswerRow[] = [],
    extraSubmissions: ReturnType<typeof makeSubmission>[] = [],
  ) {
    const employeeSubmissions = Array.from({length: employeeCount}, (_, i) =>
      makeSubmission(`e-sub-${i + 1}`, 'employee'),
    );

    mockProjectRepo.findById.mockResolvedValue(
      makeProject() as ReturnType<typeof makeProject>,
    );
    mockSubmissionRepo.findAllByProject.mockResolvedValue([
      ...employeeSubmissions,
      ...extraSubmissions,
    ]);
    mockAnswerRepo.getAnswersWithQuestions.mockResolvedValue(
      answerRows as Awaited<
        ReturnType<SurveyAnswerRepository['getAnswersWithQuestions']>
      >,
    );
    mockValueSelectionRepo.getSelectionsByAnswers.mockResolvedValue(new Map());
    mockQuestionOptionRepo.getOptionsByQuestionKeys.mockResolvedValue(
      new Map(),
    );
    mockSelectionOptionRepo.getOptionsByKeys.mockResolvedValue([]);
  }

  describe('assemble', () => {
    it('throws project_not_found when project does not exist', async () => {
      mockProjectRepo.findById.mockResolvedValue(null);

      await expect(service.assemble(PROJECT_ID)).rejects.toThrow(
        'project_not_found',
      );
    });

    it(`throws insufficient_submissions when fewer than ${MINIMUM_EMPLOYEE_SUBMISSIONS} submitted employee submissions`, async () => {
      mockProjectRepo.findById.mockResolvedValue(
        makeProject() as ReturnType<typeof makeProject>,
      );
      mockSubmissionRepo.findAllByProject.mockResolvedValue([
        makeSubmission('emp-1', 'employer'),
        makeSubmission('sub-1', 'employee'),
        makeSubmission('sub-2', 'employee'),
      ]);

      await expect(service.assemble(PROJECT_ID)).rejects.toThrow(
        'insufficient_submissions',
      );
    });

    it('throws insufficient_submissions when there are zero employee submissions', async () => {
      mockProjectRepo.findById.mockResolvedValue(
        makeProject() as ReturnType<typeof makeProject>,
      );
      mockSubmissionRepo.findAllByProject.mockResolvedValue([]);

      await expect(service.assemble(PROJECT_ID)).rejects.toThrow(
        'insufficient_submissions',
      );
    });

    it('only counts submitted (not in_progress) employee submissions toward threshold', async () => {
      mockProjectRepo.findById.mockResolvedValue(
        makeProject() as ReturnType<typeof makeProject>,
      );
      mockSubmissionRepo.findAllByProject.mockResolvedValue([
        makeSubmission('e-sub-1', 'employee', 'submitted'),
        makeSubmission('e-sub-2', 'employee', 'submitted'),
        makeSubmission('e-sub-3', 'employee', 'in_progress'), // should not count
      ]);

      await expect(service.assemble(PROJECT_ID)).rejects.toThrow(
        'insufficient_submissions',
      );
    });

    it('succeeds with exactly MINIMUM_EMPLOYEE_SUBMISSIONS', async () => {
      setupHappyPath(MINIMUM_EMPLOYEE_SUBMISSIONS);

      const payload = await service.assemble(PROJECT_ID);

      expect(payload.project_id).toBe(PROJECT_ID);
    });

    it('aggregates text answers across employee submissions', async () => {
      const answerRows = [
        makeAnswerRow('a1', 'e-sub-1', 'culture', 'text', 'Great culture'),
        makeAnswerRow('a2', 'e-sub-2', 'culture', 'text', 'Team spirit'),
        makeAnswerRow('a3', 'e-sub-3', 'culture', 'text', 'Innovative'),
      ];

      setupHappyPath(3, answerRows);

      const payload = await service.assemble(PROJECT_ID);

      expect(payload.employee_survey.culture).toEqual({
        prompt: 'Prompt for culture',
        question_type: 'text',
        responses: ['Great culture', 'Team spirit', 'Innovative'],
      });
    });

    it('skips null and whitespace-only text answers', async () => {
      const answerRows = [
        makeAnswerRow('a1', 'e-sub-1', 'culture', 'text', 'Valid answer'),
        makeAnswerRow('a2', 'e-sub-2', 'culture', 'text', null),
        makeAnswerRow('a3', 'e-sub-3', 'culture', 'text', '   '),
      ];

      setupHappyPath(3, answerRows);

      const payload = await service.assemble(PROJECT_ID);

      expect(
        (payload.employee_survey.culture as {responses: string[]}).responses,
      ).toEqual(['Valid answer']);
    });

    it('computes frequency counts and percentages for multi_select answers', async () => {
      const answerRows = [
        makeAnswerRow('a1', 'e-sub-1', 'core_values', 'multi_select'),
        makeAnswerRow('a2', 'e-sub-2', 'core_values', 'multi_select'),
        makeAnswerRow('a3', 'e-sub-3', 'core_values', 'multi_select'),
      ];

      setupHappyPath(3, answerRows);

      mockValueSelectionRepo.getSelectionsByAnswers.mockResolvedValue(
        new Map([
          ['a1', ['innovation', 'teamwork']],
          ['a2', ['innovation']],
          ['a3', ['teamwork']],
        ]),
      );
      mockSelectionOptionRepo.getOptionsByKeys.mockResolvedValue([
        {
          created_at: null,
          key: 'innovation',
          label_de: 'Innovation',
          option_type: 'value' as const,
        },
        {
          created_at: null,
          key: 'teamwork',
          label_de: 'Teamarbeit',
          option_type: 'value' as const,
        },
      ]);

      const payload = await service.assemble(PROJECT_ID);

      // Options are sorted by key: innovation < teamwork
      expect(payload.employee_survey.core_values).toEqual({
        options: [
          {
            count: 2,
            key: 'innovation',
            label_de: 'Innovation',
            percentage: 2 / 3,
          },
          {
            count: 2,
            key: 'teamwork',
            label_de: 'Teamarbeit',
            percentage: 2 / 3,
          },
        ],
        prompt: 'Prompt for core_values',
        question_type: 'multi_select',
      });
    });

    it('falls back to option key as label when label is not found', async () => {
      const answerRows = [
        makeAnswerRow('a1', 'e-sub-1', 'core_values', 'multi_select'),
        makeAnswerRow('a2', 'e-sub-2', 'core_values', 'multi_select'),
        makeAnswerRow('a3', 'e-sub-3', 'core_values', 'multi_select'),
      ];

      setupHappyPath(3, answerRows);

      mockValueSelectionRepo.getSelectionsByAnswers.mockResolvedValue(
        new Map([
          ['a1', ['unknown_key']],
          ['a2', ['unknown_key']],
          ['a3', ['unknown_key']],
        ]),
      );
      mockSelectionOptionRepo.getOptionsByKeys.mockResolvedValue([]); // no labels found

      const payload = await service.assemble(PROJECT_ID);

      const {options} = payload.employee_survey.core_values as {
        options: {key: string; label_de: string}[];
      };

      expect(options[0].label_de).toBe('unknown_key'); // falls back to key
    });

    it('resolves single_select labels from question options', async () => {
      const answerRows = [
        makeAnswerRow('a1', 'e-sub-1', 'work_style', 'single_select'),
        makeAnswerRow('a2', 'e-sub-2', 'work_style', 'single_select'),
        makeAnswerRow('a3', 'e-sub-3', 'work_style', 'single_select'),
      ];

      setupHappyPath(3, answerRows);

      mockValueSelectionRepo.getSelectionsByAnswers.mockResolvedValue(
        new Map([
          ['a1', ['remote']],
          ['a2', ['remote']],
          ['a3', ['office']],
        ]),
      );
      mockQuestionOptionRepo.getOptionsByQuestionKeys.mockResolvedValue(
        new Map([
          [
            'work_style',
            [
              {label: 'Remote', value_key: 'remote'},
              {label: 'Office', value_key: 'office'},
            ],
          ],
        ]),
      );

      const payload = await service.assemble(PROJECT_ID);

      const {options} = payload.employee_survey.work_style as {
        options: {key: string; label_de: string}[];
      };

      expect(options.find(o => o.key === 'remote')?.label_de).toBe('Remote');
      expect(options.find(o => o.key === 'office')?.label_de).toBe('Office');
    });

    it('builds employer survey data from a single submitted submission', async () => {
      const employerSubmission = makeSubmission('emp-sub-1', 'employer');
      const answerRows = [
        makeAnswerRow(
          'a-emp',
          'emp-sub-1',
          'mission',
          'long_text',
          'Our mission is growth',
        ),
      ];

      mockProjectRepo.findById.mockResolvedValue(
        makeProject() as ReturnType<typeof makeProject>,
      );
      mockSubmissionRepo.findAllByProject.mockResolvedValue([
        employerSubmission,
        makeSubmission('e-sub-1', 'employee'),
        makeSubmission('e-sub-2', 'employee'),
        makeSubmission('e-sub-3', 'employee'),
      ]);
      mockAnswerRepo.getAnswersWithQuestions.mockResolvedValue(
        answerRows as Awaited<
          ReturnType<SurveyAnswerRepository['getAnswersWithQuestions']>
        >,
      );
      mockValueSelectionRepo.getSelectionsByAnswers.mockResolvedValue(
        new Map(),
      );
      mockQuestionOptionRepo.getOptionsByQuestionKeys.mockResolvedValue(
        new Map(),
      );
      mockSelectionOptionRepo.getOptionsByKeys.mockResolvedValue([]);

      const payload = await service.assemble(PROJECT_ID);

      expect(payload.employer_survey).not.toBeNull();
      expect(payload.employer_survey!.submission_id).toBe('emp-sub-1');
      expect(payload.employer_survey!.submitted_at).toBe(
        '2026-01-02T00:00:00Z',
      );
      expect(payload.employer_survey!.answers.mission).toEqual({
        prompt: 'Prompt for mission',
        question_type: 'long_text',
        text: 'Our mission is growth',
      });
    });

    it('builds employer select answer with selected_options', async () => {
      const answerRows = [
        makeAnswerRow('a-emp', 'emp-sub-1', 'priority', 'single_select'),
      ];

      mockProjectRepo.findById.mockResolvedValue(
        makeProject() as ReturnType<typeof makeProject>,
      );
      mockSubmissionRepo.findAllByProject.mockResolvedValue([
        makeSubmission('emp-sub-1', 'employer'),
        makeSubmission('e-sub-1', 'employee'),
        makeSubmission('e-sub-2', 'employee'),
        makeSubmission('e-sub-3', 'employee'),
      ]);
      mockAnswerRepo.getAnswersWithQuestions.mockResolvedValue(
        answerRows as Awaited<
          ReturnType<SurveyAnswerRepository['getAnswersWithQuestions']>
        >,
      );
      mockValueSelectionRepo.getSelectionsByAnswers.mockResolvedValue(
        new Map([['a-emp', ['growth']]]),
      );
      mockQuestionOptionRepo.getOptionsByQuestionKeys.mockResolvedValue(
        new Map([['priority', [{label: 'Growth', value_key: 'growth'}]]]),
      );
      mockSelectionOptionRepo.getOptionsByKeys.mockResolvedValue([]);

      const payload = await service.assemble(PROJECT_ID);

      expect(payload.employer_survey!.answers.priority).toEqual({
        prompt: 'Prompt for priority',
        question_type: 'single_select',
        selected_options: [{key: 'growth', label_de: 'Growth'}],
      });
    });

    it('sets employer_survey to null when no submitted employer submission exists', async () => {
      setupHappyPath(3);

      const payload = await service.assemble(PROJECT_ID);

      expect(payload.employer_survey).toBeNull();
    });

    it('resolves industry name when project has an industry ID', async () => {
      const mockMaybeSingle = jest
        .fn()
        .mockResolvedValue({data: {name: 'Technology'}, error: null});
      const mockEq = jest.fn().mockReturnValue({maybeSingle: mockMaybeSingle});
      const mockSelect = jest.fn().mockReturnValue({eq: mockEq});

      (supabase.from as jest.Mock).mockReturnValue({select: mockSelect});

      setupHappyPath(3);
      mockProjectRepo.findById.mockResolvedValue(
        makeProject({industry: 5}) as ReturnType<typeof makeProject>,
      );

      const payload = await service.assemble(PROJECT_ID);

      expect(payload.company_context.industry_name).toBe('Technology');
      expect(supabase.from).toHaveBeenCalledWith('industries');
    });

    it('sets industry_name to null when project has no industry', async () => {
      setupHappyPath(3);

      const payload = await service.assemble(PROJECT_ID);

      expect(payload.company_context.industry_name).toBeNull();
      expect(supabase.from).not.toHaveBeenCalled();
    });

    it('sets industry_name to null when industry lookup fails', async () => {
      const mockMaybeSingle = jest
        .fn()
        .mockResolvedValue({data: null, error: {message: 'lookup error'}});
      const mockEq = jest.fn().mockReturnValue({maybeSingle: mockMaybeSingle});
      const mockSelect = jest.fn().mockReturnValue({eq: mockEq});

      (supabase.from as jest.Mock).mockReturnValue({select: mockSelect});

      setupHappyPath(3);
      mockProjectRepo.findById.mockResolvedValue(
        makeProject({industry: 5}) as ReturnType<typeof makeProject>,
      );

      const payload = await service.assemble(PROJECT_ID);

      expect(payload.company_context.industry_name).toBeNull();
    });

    it('includes correct company context from project', async () => {
      setupHappyPath(3);
      mockProjectRepo.findById.mockResolvedValue(
        makeProject({
          company_name: 'Acme Corp',
          employee_count: '500-1000',
          location: 'Berlin',
        }) as ReturnType<typeof makeProject>,
      );

      const payload = await service.assemble(PROJECT_ID);

      expect(payload.company_context).toEqual({
        company_name: 'Acme Corp',
        employee_count: '500-1000',
        industry_name: null,
        location: 'Berlin',
      });
    });

    it('sets employee_count and location to null when missing', async () => {
      setupHappyPath(3);
      mockProjectRepo.findById.mockResolvedValue(
        makeProject({employee_count: null, location: null}) as ReturnType<
          typeof makeProject
        >,
      );

      const payload = await service.assemble(PROJECT_ID);

      expect(payload.company_context.employee_count).toBeNull();
      expect(payload.company_context.location).toBeNull();
    });

    it('identifies questions_below_threshold in data quality', async () => {
      const answerRows = [
        // q1 answered by all 3 → above threshold
        makeAnswerRow('a1', 'e-sub-1', 'q1', 'text', 'r1'),
        makeAnswerRow('a2', 'e-sub-2', 'q1', 'text', 'r2'),
        makeAnswerRow('a3', 'e-sub-3', 'q1', 'text', 'r3'),
        // q2 answered by only 2 → below threshold
        makeAnswerRow('a4', 'e-sub-1', 'q2', 'text', 'r4'),
        makeAnswerRow('a5', 'e-sub-2', 'q2', 'text', 'r5'),
      ];

      setupHappyPath(3, answerRows);

      const payload = await service.assemble(PROJECT_ID);

      expect(payload.data_quality.questions_below_threshold).toEqual(['q2']);
      expect(payload.data_quality.total_submissions).toBe(3);
    });

    it('returns empty questions_below_threshold when all questions have enough answers', async () => {
      const answerRows = [
        makeAnswerRow('a1', 'e-sub-1', 'q1', 'text', 'r1'),
        makeAnswerRow('a2', 'e-sub-2', 'q1', 'text', 'r2'),
        makeAnswerRow('a3', 'e-sub-3', 'q1', 'text', 'r3'),
      ];

      setupHappyPath(3, answerRows);

      const payload = await service.assemble(PROJECT_ID);

      expect(payload.data_quality.questions_below_threshold).toEqual([]);
    });

    it('computes completion_rate correctly', async () => {
      // 3 submitted + 2 in_progress = 5 total → rate = 0.6
      mockProjectRepo.findById.mockResolvedValue(
        makeProject() as ReturnType<typeof makeProject>,
      );
      mockSubmissionRepo.findAllByProject.mockResolvedValue([
        makeSubmission('e-sub-1', 'employee', 'submitted'),
        makeSubmission('e-sub-2', 'employee', 'submitted'),
        makeSubmission('e-sub-3', 'employee', 'submitted'),
        makeSubmission('e-sub-4', 'employee', 'in_progress'),
        makeSubmission('e-sub-5', 'employee', 'in_progress'),
      ]);
      mockAnswerRepo.getAnswersWithQuestions.mockResolvedValue([]);
      mockValueSelectionRepo.getSelectionsByAnswers.mockResolvedValue(
        new Map(),
      );
      mockQuestionOptionRepo.getOptionsByQuestionKeys.mockResolvedValue(
        new Map(),
      );
      mockSelectionOptionRepo.getOptionsByKeys.mockResolvedValue([]);

      const payload = await service.assemble(PROJECT_ID);

      expect(payload.data_quality.completion_rate).toBe(0.6);
    });

    it('saves the assembled payload to evp_ai_results', async () => {
      setupHappyPath(3);

      await service.assemble(PROJECT_ID);

      expect(mockAiResultRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({
          input_snapshot: {},
          model_used: 'data_assembly',
          pipeline_step: 'assembly',
          project_id: PROJECT_ID,
        }),
      );
    });

    it('returns the assembled payload', async () => {
      setupHappyPath(3);

      const payload = await service.assemble(PROJECT_ID);

      expect(payload.project_id).toBe(PROJECT_ID);
      expect(payload.company_context).toBeDefined();
      expect(payload.data_quality).toBeDefined();
      expect(payload.employee_survey).toBeDefined();
    });
  });
});
