/**
 * @jest-environment node
 */
/* eslint-disable sort-keys */

// Mock the OpenAI module first
import AnalysisService, {
  callOpenAi,
  callOpenAiWithRetry,
  createOpenAiClient,
} from './analysisService';

import {AiResultRepository} from '@/lib/repositories/aiResultRepository';
import {AnalysisResult} from '@/lib/types/pipeline';

const mockCreate = jest.fn();

jest.mock('openai', () => {
  return {
    default: jest.fn().mockImplementation(() => ({
      chat: {
        completions: {
          create: mockCreate,
        },
      },
    })),
  };
});

jest.mock('@/lib/repositories/aiResultRepository');

const PROJECT_ID = 'proj-0000-0000-0000-000000000001';

const mockAnalysisResult: AnalysisResult = {
  cross_question_patterns: [
    {
      pattern: 'Flexibility valued company-wide',
      evidence_from_questions: ['why_do_you_stay', 'what_would_you_change'],
      description:
        '3 respondents cite flexibility as key in multiple questions.',
    },
  ],
  data_gaps: ['Only 2 respondents answered the compensation question'],
  evp_pillars: [
    {
      confidence: 'high',
      employee_evidence: '3 of 3 respondents mentioned team culture.',
      employer_intent_alignment: 'strong',
      label: 'Strong team culture',
      strength: 'Consistent signal across questions',
    },
  ],
  per_question_signals: [
    {
      individual_signals: [
        {
          convergence: 'individual',
          label: 'Proximity to home',
          mentioned_by: 1,
          out_of: 3,
          quote: 'The office is close to where I live.',
        },
      ],
      question_key: 'why_do_you_stay',
      question_prompt: 'What makes you stay at this company?',
      shared_signals: [
        {
          convergence: 'shared',
          label: 'Team cohesion',
          mentioned_by: 2,
          out_of: 3,
          representative_quote: 'The people here genuinely care.',
        },
      ],
      tensions: [],
    },
  ],
  risk_signals: [],
  sample_size_note: 'Based on 3 employee responses.',
  total_respondents: 3,
  value_tensions: [],
};

const mockAssemblyRecord = {
  generated_at: '2026-01-01T00:00:00Z',
  id: 'result-001',
  input_snapshot: {},
  model_used: 'data_assembly',
  pipeline_step: 'assembly' as const,
  project_id: PROJECT_ID,
  result_json: {
    company_context: {
      company_name: 'Test Corp',
      employee_count: '100-500',
      industry_name: 'Tech',
      location: 'Munich',
    },
    data_quality: {
      completion_rate: 1,
      questions_below_threshold: [],
      total_submissions: 3,
    },
    employee_survey: {},
    employer_survey: null,
    project_id: PROJECT_ID,
  },
  result_text: null,
  target_audience: null,
};

function makeOpenAiResponse(content: string) {
  return {
    choices: [
      {
        message: {content},
      },
    ],
  };
}

describe('createOpenAiClient', () => {
  const originalApiKey = process.env.OPENAI_API_KEY;

  afterEach(() => {
    process.env.OPENAI_API_KEY = originalApiKey;
  });

  it('should throw when OPENAI_API_KEY is not set', () => {
    delete process.env.OPENAI_API_KEY;

    expect(() => createOpenAiClient()).toThrow(
      'OPENAI_API_KEY environment variable is not set',
    );
  });
});

describe('callOpenAi', () => {
  const mockClient = {
    chat: {completions: {create: mockCreate}},
  } as unknown as import('openai').default;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return parsed JSON from the API response', async () => {
    mockCreate.mockResolvedValue(
      makeOpenAiResponse(JSON.stringify(mockAnalysisResult)),
    );

    const result = await callOpenAi(mockClient, 'system', 'user');

    expect(result).toEqual(mockAnalysisResult);
    expect(mockCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        model: 'gpt-4o-mini',
        response_format: {type: 'json_object'},
      }),
    );
  });

  it('should throw openai_empty_response when content is null', async () => {
    mockCreate.mockResolvedValue({choices: [{message: {content: null}}]});

    await expect(callOpenAi(mockClient, 'system', 'user')).rejects.toThrow(
      'openai_empty_response',
    );
  });

  it('should throw openai_empty_response when choices is empty', async () => {
    mockCreate.mockResolvedValue({choices: []});

    await expect(callOpenAi(mockClient, 'system', 'user')).rejects.toThrow(
      'openai_empty_response',
    );
  });

  it('should throw openai_invalid_json when content is not valid JSON', async () => {
    mockCreate.mockResolvedValue(makeOpenAiResponse('not valid json {'));

    await expect(callOpenAi(mockClient, 'system', 'user')).rejects.toThrow(
      'openai_invalid_json',
    );
  });

  it('should propagate API errors', async () => {
    mockCreate.mockRejectedValue(new Error('rate_limit_exceeded'));

    await expect(callOpenAi(mockClient, 'system', 'user')).rejects.toThrow(
      'rate_limit_exceeded',
    );
  });
});

describe('callOpenAiWithRetry', () => {
  const mockClient = {
    chat: {completions: {create: mockCreate}},
  } as unknown as import('openai').default;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return result when first attempt validates', async () => {
    mockCreate.mockResolvedValue(
      makeOpenAiResponse(JSON.stringify(mockAnalysisResult)),
    );

    const result = await callOpenAiWithRetry(mockClient, 'system', 'user');

    expect(result).toEqual(mockAnalysisResult);
    expect(mockCreate).toHaveBeenCalledTimes(1);
  });

  it('should retry when first attempt fails schema validation', async () => {
    const invalid = {wrong: 'structure'};

    mockCreate
      .mockResolvedValueOnce(makeOpenAiResponse(JSON.stringify(invalid)))
      .mockResolvedValueOnce(
        makeOpenAiResponse(JSON.stringify(mockAnalysisResult)),
      );

    const result = await callOpenAiWithRetry(mockClient, 'system', 'user');

    expect(result).toEqual(mockAnalysisResult);
    expect(mockCreate).toHaveBeenCalledTimes(2);
  });

  it('should throw analysis_validation_failed when both attempts fail', async () => {
    const invalid = {wrong: 'structure'};

    mockCreate.mockResolvedValue(makeOpenAiResponse(JSON.stringify(invalid)));

    await expect(
      callOpenAiWithRetry(mockClient, 'system', 'user'),
    ).rejects.toThrow('analysis_validation_failed');
    expect(mockCreate).toHaveBeenCalledTimes(2);
  });

  it('should throw when API call throws on first attempt', async () => {
    mockCreate.mockRejectedValue(new Error('timeout'));

    await expect(
      callOpenAiWithRetry(mockClient, 'system', 'user'),
    ).rejects.toThrow('timeout');
  });
});

describe('AnalysisService.analyze', () => {
  const mockFindLatestByStep = jest.fn();
  const mockSave = jest.fn();
  const mockFactory = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    process.env.OPENAI_API_KEY = 'test-key';

    (
      AiResultRepository as jest.MockedClass<typeof AiResultRepository>
    ).mockImplementation(
      () =>
        ({
          findLatestByStep: mockFindLatestByStep,
          save: mockSave,
        }) as unknown as AiResultRepository,
    );

    const mockClient = {
      chat: {completions: {create: mockCreate}},
    } as unknown as import('openai').default;

    mockFactory.mockReturnValue(mockClient);
  });

  afterEach(() => {
    delete process.env.OPENAI_API_KEY;
  });

  it('should throw assembly_not_found when no assembly result exists', async () => {
    mockFindLatestByStep.mockResolvedValue(null);

    const service = new AnalysisService(mockFactory);

    await expect(service.analyze(PROJECT_ID)).rejects.toThrow(
      'assembly_not_found',
    );
    expect(mockFindLatestByStep).toHaveBeenCalledWith(PROJECT_ID, 'assembly');
    expect(mockSave).not.toHaveBeenCalled();
  });

  it('should return analysis result and save it on success', async () => {
    mockFindLatestByStep.mockResolvedValue(mockAssemblyRecord);
    mockCreate.mockResolvedValue(
      makeOpenAiResponse(JSON.stringify(mockAnalysisResult)),
    );
    mockSave.mockResolvedValue({id: 'new-result-id'});

    const service = new AnalysisService(mockFactory);
    const result = await service.analyze(PROJECT_ID);

    expect(result).toEqual(mockAnalysisResult);
    expect(mockSave).toHaveBeenCalledWith(
      expect.objectContaining({
        model_used: 'gpt-4o-mini',
        pipeline_step: 'analysis',
        project_id: PROJECT_ID,
        result_json: mockAnalysisResult,
      }),
    );
  });

  it('should propagate analysis_validation_failed after retry exhaustion', async () => {
    mockFindLatestByStep.mockResolvedValue(mockAssemblyRecord);
    mockCreate.mockResolvedValue(
      makeOpenAiResponse(JSON.stringify({invalid: 'schema'})),
    );

    const service = new AnalysisService(mockFactory);

    await expect(service.analyze(PROJECT_ID)).rejects.toThrow(
      'analysis_validation_failed',
    );
    expect(mockSave).not.toHaveBeenCalled();
  });

  it('should propagate OpenAI API errors', async () => {
    mockFindLatestByStep.mockResolvedValue(mockAssemblyRecord);
    mockCreate.mockRejectedValue(new Error('rate_limit_exceeded'));

    const service = new AnalysisService(mockFactory);

    await expect(service.analyze(PROJECT_ID)).rejects.toThrow(
      'rate_limit_exceeded',
    );
    expect(mockSave).not.toHaveBeenCalled();
  });

  it('should propagate save errors', async () => {
    mockFindLatestByStep.mockResolvedValue(mockAssemblyRecord);
    mockCreate.mockResolvedValue(
      makeOpenAiResponse(JSON.stringify(mockAnalysisResult)),
    );
    mockSave.mockRejectedValue(new Error('Failed to save AI result: db error'));

    const service = new AnalysisService(mockFactory);

    await expect(service.analyze(PROJECT_ID)).rejects.toThrow(
      'Failed to save AI result: db error',
    );
  });

  it('should use the assembly result_json as input_snapshot when saving', async () => {
    mockFindLatestByStep.mockResolvedValue(mockAssemblyRecord);
    mockCreate.mockResolvedValue(
      makeOpenAiResponse(JSON.stringify(mockAnalysisResult)),
    );
    mockSave.mockResolvedValue({id: 'new-result-id'});

    const service = new AnalysisService(mockFactory);

    await service.analyze(PROJECT_ID);

    expect(mockSave).toHaveBeenCalledWith(
      expect.objectContaining({
        input_snapshot: mockAssemblyRecord.result_json,
      }),
    );
  });

  it('should save correct pipeline_step when recording analysis result', async () => {
    mockFindLatestByStep.mockResolvedValue(mockAssemblyRecord);
    mockCreate.mockResolvedValue(
      makeOpenAiResponse(JSON.stringify(mockAnalysisResult)),
    );
    mockSave.mockResolvedValue({id: 'new-result-id'});

    const service = new AnalysisService(mockFactory);

    await service.analyze(PROJECT_ID);

    expect(mockSave).toHaveBeenCalledWith(
      expect.objectContaining({
        pipeline_step: 'analysis',
      }),
    );
  });

  it('should make two API calls when first validation fails', async () => {
    const invalid = {wrong: 'structure'};

    mockFindLatestByStep.mockResolvedValue(mockAssemblyRecord);
    mockCreate
      .mockResolvedValueOnce(makeOpenAiResponse(JSON.stringify(invalid)))
      .mockResolvedValueOnce(
        makeOpenAiResponse(JSON.stringify(mockAnalysisResult)),
      );
    mockSave.mockResolvedValue({id: 'new-result-id'});

    const service = new AnalysisService(mockFactory);

    await service.analyze(PROJECT_ID);

    expect(mockCreate).toHaveBeenCalledTimes(2);
  });

  it('should use gpt-4o-mini model in API calls', async () => {
    mockFindLatestByStep.mockResolvedValue(mockAssemblyRecord);
    mockCreate.mockResolvedValue(
      makeOpenAiResponse(JSON.stringify(mockAnalysisResult)),
    );
    mockSave.mockResolvedValue({id: 'new-result-id'});

    const service = new AnalysisService(mockFactory);

    await service.analyze(PROJECT_ID);

    expect(mockCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        model: 'gpt-4o-mini',
      }),
    );
  });

  it('should handle questions_below_threshold in data quality', async () => {
    const assemblyRecordWithThreshold = {
      ...mockAssemblyRecord,
      result_json: {
        ...mockAssemblyRecord.result_json,
        data_quality: {
          ...mockAssemblyRecord.result_json.data_quality,
          questions_below_threshold: ['q1', 'q2'],
        },
      },
    };

    mockFindLatestByStep.mockResolvedValue(assemblyRecordWithThreshold);
    mockCreate.mockResolvedValue(
      makeOpenAiResponse(JSON.stringify(mockAnalysisResult)),
    );
    mockSave.mockResolvedValue({id: 'new-result-id'});

    const service = new AnalysisService(mockFactory);
    const result = await service.analyze(PROJECT_ID);

    expect(result).toEqual(mockAnalysisResult);
    expect(mockCreate).toHaveBeenCalled();
  });

  it('should handle different completion rates in analysis', async () => {
    const assemblyRecordLowCompletion = {
      ...mockAssemblyRecord,
      result_json: {
        ...mockAssemblyRecord.result_json,
        data_quality: {
          ...mockAssemblyRecord.result_json.data_quality,
          completion_rate: 0.5,
        },
      },
    };

    mockFindLatestByStep.mockResolvedValue(assemblyRecordLowCompletion);
    mockCreate.mockResolvedValue(
      makeOpenAiResponse(JSON.stringify(mockAnalysisResult)),
    );
    mockSave.mockResolvedValue({id: 'new-result-id'});

    const service = new AnalysisService(mockFactory);
    const result = await service.analyze(PROJECT_ID);

    expect(result).toEqual(mockAnalysisResult);
  });

  it('should handle empty employer survey in analysis', async () => {
    const assemblyRecordWithoutEmployerSurvey = {
      ...mockAssemblyRecord,
      result_json: {
        ...mockAssemblyRecord.result_json,
        employer_survey: null,
      },
    };

    mockFindLatestByStep.mockResolvedValue(assemblyRecordWithoutEmployerSurvey);
    mockCreate.mockResolvedValue(
      makeOpenAiResponse(JSON.stringify(mockAnalysisResult)),
    );
    mockSave.mockResolvedValue({id: 'new-result-id'});

    const service = new AnalysisService(mockFactory);
    const result = await service.analyze(PROJECT_ID);

    expect(result).toEqual(mockAnalysisResult);
  });
});
