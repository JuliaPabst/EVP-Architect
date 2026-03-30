import Anthropic from '@anthropic-ai/sdk';

import {AiResultRepository} from '@/lib/repositories/aiResultRepository';
import EvpOutputService from '@/lib/services/evpOutputService';
import {EvpAiResult} from '@/lib/types/database';

jest.mock('@anthropic-ai/sdk');
jest.mock('@/lib/repositories/aiResultRepository');

describe('EvpOutputService', () => {
  let mockClient: Anthropic;
  let mockClientFactory: jest.Mock;
  let mockRepository: jest.Mocked<AiResultRepository>;

  const mockProjectId = 'project-123';
  const mockAnalysisRecord: EvpAiResult = {
    generated_at: '2026-03-30T10:00:00Z',
    id: 'analysis-id',
    input_snapshot: {
      company_context: {company_name: 'Test Corp'},
    },
    model_used: 'gpt-4o-mini',
    pipeline_step: 'analysis',
    project_id: mockProjectId,
    result_json: {
      cross_question_patterns: [],
      data_gaps: [],
      evp_pillars: [
        {
          confidence: 'high',
          employee_evidence: 'Strong team culture',
          employer_intent_alignment: 'strong',
          label: 'Team Culture',
          strength: 'Very strong',
        },
      ],
      per_question_signals: [],
      risk_signals: [],
      sample_size_note: 'Based on 5 respondents',
      total_respondents: 5,
      value_tensions: [],
    } as unknown as Record<string, unknown>,
    result_text: null,
    target_audience: null,
  };

  const mockAssemblyRecord: EvpAiResult = {
    generated_at: '2026-03-30T09:00:00Z',
    id: 'assembly-id',
    input_snapshot: {},
    model_used: 'code',
    pipeline_step: 'assembly',
    project_id: mockProjectId,
    result_json: {
      company_context: {
        company_name: 'Test Corp',
        employee_count: '50',
        industry_name: 'Tech',
        location: 'Berlin',
      },
      data_quality: {
        completion_rate: 0.8,
        questions_below_threshold: [],
        total_submissions: 5,
      },
      employee_survey: {},
      employer_survey: {
        answers: {
          tone_of_voice: {
            prompt: 'Tone?',
            question_type: 'single_select',
            selected_options: [
              {
                key: 'formal',
                label_de: 'Professionell & sachlich',
              },
            ],
          },
        },
        submission_id: 'sub-1',
        submitted_at: '2026-03-30T08:00:00Z',
      },
      project_id: mockProjectId,
    } as unknown as Record<string, unknown>,
    result_text: null,
    target_audience: null,
  };

  beforeEach(() => {
    jest.clearAllMocks();

    mockClient = new Anthropic() as jest.Mocked<Anthropic>;
    mockClientFactory = jest.fn().mockReturnValue(mockClient);

    mockRepository =
      new AiResultRepository() as jest.Mocked<AiResultRepository>;
    (
      AiResultRepository as jest.MockedClass<typeof AiResultRepository>
    ).mockImplementation(() => mockRepository);

    mockClient.messages = {
      create: jest.fn().mockResolvedValue({
        content: [{text: 'Generated EVP content', type: 'text'}],
        stop_reason: 'end_turn',
      }),
    } as unknown as Anthropic['messages'];
  });

  describe('generate', () => {
    it('generates internal EVP and saves result', async () => {
      mockRepository.findLatestByStep
        .mockResolvedValueOnce(mockAnalysisRecord)
        .mockResolvedValueOnce(mockAssemblyRecord);

      const service = new EvpOutputService(mockClientFactory);
      const result = await service.generate(mockProjectId, 'internal');

      expect(result).toBe('Generated EVP content');

      expect(mockRepository.findLatestByStep).toHaveBeenCalledWith(
        mockProjectId,
        'analysis',
      );
      expect(mockRepository.findLatestByStep).toHaveBeenCalledWith(
        mockProjectId,
        'assembly',
      );

      expect(mockRepository.save).toHaveBeenCalledWith({
        input_snapshot: mockAnalysisRecord.result_json,
        model_used: 'claude-sonnet-4-5',
        pipeline_step: 'internal',
        project_id: mockProjectId,
        result_text: 'Generated EVP content',
        target_audience: null,
      });
    });

    it('generates external EVP with tone injection', async () => {
      mockRepository.findLatestByStep
        .mockResolvedValueOnce(mockAnalysisRecord)
        .mockResolvedValueOnce(mockAssemblyRecord);

      const service = new EvpOutputService(mockClientFactory);
      const result = await service.generate(mockProjectId, 'external');

      expect(result).toBe('Generated EVP content');

      // Verify tone was extracted and used in prompt
      const callArgs = (mockClient.messages.create as jest.Mock).mock
        .calls[0][0];

      expect(callArgs.system).toContain(
        'Formal, precise, structured sentences',
      );
    });

    it('generates external EVP with target audience parameter', async () => {
      mockRepository.findLatestByStep
        .mockResolvedValueOnce(mockAnalysisRecord)
        .mockResolvedValueOnce(mockAssemblyRecord);

      const service = new EvpOutputService(mockClientFactory);
      const result = await service.generate(
        mockProjectId,
        'external',
        'software engineers',
      );

      expect(result).toBe('Generated EVP content');

      expect(mockRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          target_audience: 'software engineers',
        }),
      );

      const callArgs = (mockClient.messages.create as jest.Mock).mock
        .calls[0][0];

      expect(callArgs.messages[0].content).toContain('software engineers');
    });

    it('generates gap analysis without tone injection', async () => {
      mockRepository.findLatestByStep
        .mockResolvedValueOnce(mockAnalysisRecord)
        .mockResolvedValueOnce(mockAssemblyRecord);

      const service = new EvpOutputService(mockClientFactory);
      const result = await service.generate(mockProjectId, 'gap_analysis');

      expect(result).toBe('Generated EVP content');

      expect(mockRepository.save).toHaveBeenCalledWith({
        input_snapshot: mockAnalysisRecord.result_json,
        model_used: 'claude-sonnet-4-5',
        pipeline_step: 'gap_analysis',
        project_id: mockProjectId,
        result_text: 'Generated EVP content',
        target_audience: null,
      });
    });

    it('throws analysis_not_found when analysis result does not exist', async () => {
      mockRepository.findLatestByStep.mockResolvedValueOnce(null);

      const service = new EvpOutputService(mockClientFactory);

      await expect(service.generate(mockProjectId, 'internal')).rejects.toThrow(
        'analysis_not_found',
      );
    });

    it('throws assembly_not_found when assembly result does not exist', async () => {
      mockRepository.findLatestByStep
        .mockResolvedValueOnce(mockAnalysisRecord)
        .mockResolvedValueOnce(null);

      const service = new EvpOutputService(mockClientFactory);

      await expect(service.generate(mockProjectId, 'internal')).rejects.toThrow(
        'assembly_not_found',
      );
    });

    it('uses default tone style when tone_of_voice is missing', async () => {
      const assemblyWithoutTone = {
        ...mockAssemblyRecord,
        result_json: {
          ...mockAssemblyRecord.result_json,
          employer_survey: {
            answers: {},
            submission_id: 'sub-1',
            submitted_at: '2026-03-30T08:00:00Z',
          },
        },
      };

      mockRepository.findLatestByStep
        .mockResolvedValueOnce(mockAnalysisRecord)
        .mockResolvedValueOnce(assemblyWithoutTone);

      const service = new EvpOutputService(mockClientFactory);
      const result = await service.generate(mockProjectId, 'external');

      expect(result).toBe('Generated EVP content');

      const callArgs = (mockClient.messages.create as jest.Mock).mock
        .calls[0][0];

      expect(callArgs.system).toContain('Clear, direct, and professional');
    });

    it('uses default tone style when tone_of_voice has unknown key', async () => {
      const assemblyWithUnknownTone = {
        ...mockAssemblyRecord,
        result_json: {
          ...mockAssemblyRecord.result_json,
          employer_survey: {
            answers: {
              tone_of_voice: {
                prompt: 'Tone?',
                question_type: 'single_select',
                selected_options: [
                  {
                    key: 'unknown_tone_key',
                    label_de: 'Some Tone',
                  },
                ],
              },
            },
            submission_id: 'sub-1',
            submitted_at: '2026-03-30T08:00:00Z',
          },
        },
      };

      mockRepository.findLatestByStep
        .mockResolvedValueOnce(mockAnalysisRecord)
        .mockResolvedValueOnce(assemblyWithUnknownTone);

      const service = new EvpOutputService(mockClientFactory);
      const result = await service.generate(mockProjectId, 'external');

      expect(result).toBe('Generated EVP content');

      const callArgs = (mockClient.messages.create as jest.Mock).mock
        .calls[0][0];

      expect(callArgs.system).toContain('Clear, direct, and professional');
    });

    it('propagates Claude API errors', async () => {
      mockRepository.findLatestByStep
        .mockResolvedValueOnce(mockAnalysisRecord)
        .mockResolvedValueOnce(mockAssemblyRecord);

      const mockError = new Error('Rate limit exceeded');

      (mockClient.messages.create as jest.Mock).mockRejectedValueOnce(
        mockError,
      );

      const service = new EvpOutputService(mockClientFactory);

      await expect(service.generate(mockProjectId, 'internal')).rejects.toThrow(
        'Rate limit exceeded',
      );
    });

    it('propagates claude_content_filtered error', async () => {
      mockRepository.findLatestByStep
        .mockResolvedValueOnce(mockAnalysisRecord)
        .mockResolvedValueOnce(mockAssemblyRecord);

      (mockClient.messages.create as jest.Mock).mockResolvedValueOnce({
        content: [{text: 'Truncated...', type: 'text'}],
        stop_reason: 'max_tokens',
      });

      const service = new EvpOutputService(mockClientFactory);

      await expect(service.generate(mockProjectId, 'internal')).rejects.toThrow(
        'claude_content_filtered',
      );
    });

    it('uses friendly_casual tone style when tone_of_voice is friendly_casual', async () => {
      const assemblyWithFriendlyTone = {
        ...mockAssemblyRecord,
        result_json: {
          ...mockAssemblyRecord.result_json,
          employer_survey: {
            answers: {
              tone_of_voice: {
                prompt: 'Tone?',
                question_type: 'single_select',
                selected_options: [
                  {
                    key: 'friendly_casual',
                    label_de: 'Locker & freundlich',
                  },
                ],
              },
            },
            submission_id: 'sub-1',
            submitted_at: '2026-03-30T08:00:00Z',
          },
        },
      };

      mockRepository.findLatestByStep
        .mockResolvedValueOnce(mockAnalysisRecord)
        .mockResolvedValueOnce(assemblyWithFriendlyTone);

      const service = new EvpOutputService(mockClientFactory);
      const result = await service.generate(mockProjectId, 'external');

      expect(result).toBe('Generated EVP content');

      const callArgs = (mockClient.messages.create as jest.Mock).mock
        .calls[0][0];

      expect(callArgs.system).toContain('Warm, conversational, approachable');
    });

    it('uses innovative_future tone style when tone_of_voice is innovative_future', async () => {
      const assemblyWithInnovativeTone = {
        ...mockAssemblyRecord,
        result_json: {
          ...mockAssemblyRecord.result_json,
          employer_survey: {
            answers: {
              tone_of_voice: {
                prompt: 'Tone?',
                question_type: 'single_select',
                selected_options: [
                  {
                    key: 'innovative_future',
                    label_de: 'Innovativ & zukunftsorientiert',
                  },
                ],
              },
            },
            submission_id: 'sub-1',
            submitted_at: '2026-03-30T08:00:00Z',
          },
        },
      };

      mockRepository.findLatestByStep
        .mockResolvedValueOnce(mockAnalysisRecord)
        .mockResolvedValueOnce(assemblyWithInnovativeTone);

      const service = new EvpOutputService(mockClientFactory);
      const result = await service.generate(mockProjectId, 'external');

      expect(result).toBe('Generated EVP content');

      const callArgs = (mockClient.messages.create as jest.Mock).mock
        .calls[0][0];

      expect(callArgs.system).toContain(
        'Dynamic, possibility-forward language',
      );
    });

    it('uses traditional_trustworthy tone style when tone_of_voice is traditional_trustworthy', async () => {
      const assemblyWithTraditionalTone = {
        ...mockAssemblyRecord,
        result_json: {
          ...mockAssemblyRecord.result_json,
          employer_survey: {
            answers: {
              tone_of_voice: {
                prompt: 'Tone?',
                question_type: 'single_select',
                selected_options: [
                  {
                    key: 'traditional_trustworthy',
                    label_de: 'Traditionell & vertrauensvoll',
                  },
                ],
              },
            },
            submission_id: 'sub-1',
            submitted_at: '2026-03-30T08:00:00Z',
          },
        },
      };

      mockRepository.findLatestByStep
        .mockResolvedValueOnce(mockAnalysisRecord)
        .mockResolvedValueOnce(assemblyWithTraditionalTone);

      const service = new EvpOutputService(mockClientFactory);
      const result = await service.generate(mockProjectId, 'external');

      expect(result).toBe('Generated EVP content');

      const callArgs = (mockClient.messages.create as jest.Mock).mock
        .calls[0][0];

      expect(callArgs.system).toContain('Stable, measured, heritage-focused');
    });

    it('does not apply tone to internal EVP', async () => {
      const assemblyWithTone = mockAssemblyRecord;

      mockRepository.findLatestByStep
        .mockResolvedValueOnce(mockAnalysisRecord)
        .mockResolvedValueOnce(assemblyWithTone);

      const service = new EvpOutputService(mockClientFactory);

      await service.generate(mockProjectId, 'internal');

      const callArgs = (mockClient.messages.create as jest.Mock).mock
        .calls[0][0];

      // Internal prompt should not mention the specific tone style
      expect(callArgs.system).not.toContain('Formal, precise');
      expect(callArgs.system).toContain('insider');
    });

    it('does not apply tone to gap analysis', async () => {
      const assemblyWithTone = mockAssemblyRecord;

      mockRepository.findLatestByStep
        .mockResolvedValueOnce(mockAnalysisRecord)
        .mockResolvedValueOnce(assemblyWithTone);

      const service = new EvpOutputService(mockClientFactory);

      await service.generate(mockProjectId, 'gap_analysis');

      const callArgs = (mockClient.messages.create as jest.Mock).mock
        .calls[0][0];

      // Gap analysis prompt should be analytical
      expect(callArgs.system).toContain('analytical');
    });
  });
});
