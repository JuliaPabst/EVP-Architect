import OpenAI from 'openai';
import {z} from 'zod';

import {AiResultRepository} from '@/lib/repositories/aiResultRepository';
import {
  AnalysisResult,
  AssemblyPayload,
  CrossQuestionPattern,
  EvpPillar,
  IndividualSignal,
  PerQuestionSignal,
  RiskSignal,
  SharedSignal,
  ValueTension,
} from '@/lib/types/pipeline';

// ─── Zod schema ─────────────────────────────────────────────────────────────

const sharedSignalSchema: z.ZodType<SharedSignal> = z.object({
  convergence: z.literal('shared'),
  label: z.string(),
  mentioned_by: z.number(),
  out_of: z.number(),
  representative_quote: z.string(),
});

const individualSignalSchema: z.ZodType<IndividualSignal> = z.object({
  convergence: z.literal('individual'),
  label: z.string(),
  mentioned_by: z.number(),
  out_of: z.number(),
  quote: z.string(),
});

const perQuestionSignalSchema: z.ZodType<PerQuestionSignal> = z.object({
  individual_signals: z.array(individualSignalSchema),
  question_key: z.string(),
  question_prompt: z.string(),
  shared_signals: z.array(sharedSignalSchema),
  tensions: z.array(z.string()),
});

const crossQuestionPatternSchema: z.ZodType<CrossQuestionPattern> = z.object({
  description: z.string(),
  evidence_from_questions: z.array(z.string()),
  pattern: z.string(),
});

const evpPillarSchema: z.ZodType<EvpPillar> = z.object({
  confidence: z.union([
    z.literal('high'),
    z.literal('medium'),
    z.literal('low'),
  ]),
  employee_evidence: z.string(),
  employer_intent_alignment: z.union([
    z.literal('strong'),
    z.literal('partial'),
    z.literal('misaligned'),
  ]),
  label: z.string(),
  strength: z.string(),
});

const riskSignalSchema: z.ZodType<RiskSignal> = z.object({
  description: z.string(),
  evidence: z.string(),
  severity: z.string(),
});

const valueTensionSchema: z.ZodType<ValueTension> = z.object({
  description: z.string(),
  evidence: z.string(),
  severity: z.string(),
});

const analysisResultSchema: z.ZodType<AnalysisResult> = z.object({
  cross_question_patterns: z.array(crossQuestionPatternSchema),
  data_gaps: z.array(z.string()),
  evp_pillars: z.array(evpPillarSchema),
  per_question_signals: z.array(perQuestionSignalSchema),
  risk_signals: z.array(riskSignalSchema),
  sample_size_note: z.string(),
  total_respondents: z.number(),
  value_tensions: z.array(valueTensionSchema),
});

// ─── Prompt builders ─────────────────────────────────────────────────────────

function buildSystemPrompt(): string {
  return `You are an expert HR analyst and employer brand strategist. Your task is to analyse employee and employer survey data to extract EVP (Employer Value Proposition) signals.

You use a convergence model to label findings:
- "shared" signal: mentioned by 2 or more respondents. Always state the exact count (e.g. "3 of 5 respondents").
- "individual" signal: mentioned by exactly 1 respondent. Do not discard it — include it as supporting texture with clear labeling.

Rules:
- Every answer matters. Do not discard signals just because only one person mentioned them. Label the convergence level clearly.
- Acknowledge the small sample size. Do not overstate patterns or claim statistical significance.
- Cross-question patterns are the strongest signal at small n — look for the same value surfacing across multiple questions.
- Compare employee reality against employer stated intent to identify authentic strengths, aspirational gaps, and disconnects.
- Output ONLY valid JSON matching the schema exactly. No commentary outside the JSON.`;
}

function buildUserPrompt(payload: AssemblyPayload): string {
  const totalRespondents = payload.data_quality.total_submissions;

  return `Analyse the following EVP survey data for ${payload.company_context.company_name}.

COMPANY CONTEXT:
${JSON.stringify(payload.company_context, null, 2)}

DATA QUALITY:
- Total submitted employee responses: ${payload.data_quality.total_submissions}
- Completion rate: ${Math.round(payload.data_quality.completion_rate * 100)}%
- Questions with fewer than 3 responses: ${payload.data_quality.questions_below_threshold.length > 0 ? payload.data_quality.questions_below_threshold.join(', ') : 'none'}

EMPLOYEE SURVEY RESPONSES:
${JSON.stringify(payload.employee_survey, null, 2)}

EMPLOYER SURVEY (company's stated intent):
${payload.employer_survey ? JSON.stringify(payload.employer_survey, null, 2) : 'No employer survey submitted'}

OUTPUT INSTRUCTIONS:
Return a JSON object with this exact structure:

{
  "sample_size_note": "Based on ${totalRespondents} employee responses. All findings represent individual voices, not statistical patterns.",
  "total_respondents": ${totalRespondents},
  "per_question_signals": [
    {
      "question_key": "<question key>",
      "question_prompt": "<full question text>",
      "shared_signals": [
        {
          "convergence": "shared",
          "label": "<theme label>",
          "mentioned_by": <number>,
          "out_of": ${totalRespondents},
          "representative_quote": "<direct quote from an employee answer>"
        }
      ],
      "individual_signals": [
        {
          "convergence": "individual",
          "label": "<theme label>",
          "mentioned_by": 1,
          "out_of": ${totalRespondents},
          "quote": "<direct quote>"
        }
      ],
      "tensions": ["<tension description if any>"]
    }
  ],
  "cross_question_patterns": [
    {
      "pattern": "<pattern name>",
      "evidence_from_questions": ["<question_key1>", "<question_key2>"],
      "description": "<explanation of the pattern>"
    }
  ],
  "evp_pillars": [
    {
      "label": "<pillar name>",
      "strength": "<brief description of how strong this pillar is>",
      "employee_evidence": "<evidence from employee answers with counts>",
      "employer_intent_alignment": "strong | partial | misaligned",
      "confidence": "high | medium | low"
    }
  ],
  "value_tensions": [
    {
      "description": "<what the tension is>",
      "severity": "high | medium | low",
      "evidence": "<evidence from the data>"
    }
  ],
  "risk_signals": [
    {
      "description": "<risk or concern>",
      "severity": "high | medium | low",
      "evidence": "<supporting quotes or patterns>"
    }
  ],
  "data_gaps": ["<questions or areas with insufficient data>"]
}

Analyse per-question signals first, then look for cross-question patterns, then synthesise EVP pillars. For each pillar, compare employee evidence against employer stated intent.`;
}

// ─── OpenAI client factory (injectable for tests) ────────────────────────────

export function createOpenAiClient(): OpenAI {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    throw new Error('OPENAI_API_KEY environment variable is not set');
  }

  return new OpenAI({apiKey});
}

// ─── Core API call ────────────────────────────────────────────────────────────

export async function callOpenAi(
  client: OpenAI,
  systemPrompt: string,
  userPrompt: string,
): Promise<unknown> {
  const response = await client.chat.completions.create({
    messages: [
      {content: systemPrompt, role: 'system'},
      {content: userPrompt, role: 'user'},
    ],
    model: 'gpt-4o-mini',
    response_format: {type: 'json_object'},
    temperature: 0.2,
  });

  const content = response.choices[0]?.message?.content;

  if (!content) {
    throw new Error('openai_empty_response');
  }

  try {
    return JSON.parse(content) as unknown;
  } catch {
    throw new Error('openai_invalid_json');
  }
}

// ─── Validation with one retry ───────────────────────────────────────────────

export async function callOpenAiWithRetry(
  client: OpenAI,
  systemPrompt: string,
  userPrompt: string,
): Promise<AnalysisResult> {
  const firstAttempt = await callOpenAi(client, systemPrompt, userPrompt);
  const firstValidation = analysisResultSchema.safeParse(firstAttempt);

  if (firstValidation.success) {
    return firstValidation.data;
  }

  console.error(
    '[AnalysisService] First attempt schema validation failed, retrying:',
    firstValidation.error.message,
  );

  const secondAttempt = await callOpenAi(client, systemPrompt, userPrompt);
  const secondValidation = analysisResultSchema.safeParse(secondAttempt);

  if (secondValidation.success) {
    return secondValidation.data;
  }

  throw new Error('analysis_validation_failed');
}

// ─── Service class ────────────────────────────────────────────────────────────

/**
 * Service for Step 1 of the EVP AI pipeline: Analysis & Synthesis.
 *
 * Loads the latest Step 0 assembly payload, sends it to gpt-4o-mini with
 * a structured prompt, validates the response, and saves the result to
 * evp_ai_results with pipeline_step = 'analysis'.
 */
class AnalysisService {
  private readonly aiResultRepository: AiResultRepository;

  private readonly openAiClientFactory: () => OpenAI;

  constructor(openAiClientFactory: () => OpenAI = createOpenAiClient) {
    this.aiResultRepository = new AiResultRepository();
    this.openAiClientFactory = openAiClientFactory;
  }

  /**
   * Run Step 1 analysis for a project.
   *
   * @param projectId - Project UUID
   * @returns The validated analysis result
   * @throws Error with code 'assembly_not_found' if no assembly result exists
   * @throws Error with code 'analysis_validation_failed' if OpenAI response is invalid after retry
   * @throws Error with code 'OPENAI_API_KEY environment variable is not set' if key is missing
   */
  async analyze(projectId: string): Promise<AnalysisResult> {
    const assemblyRecord = await this.aiResultRepository.findLatestByStep(
      projectId,
      'assembly',
    );

    if (!assemblyRecord) {
      throw new Error('assembly_not_found');
    }

    const payload = assemblyRecord.result_json as unknown as AssemblyPayload;
    const systemPrompt = buildSystemPrompt();
    const userPrompt = buildUserPrompt(payload);
    const client = this.openAiClientFactory();
    const analysisResult = await callOpenAiWithRetry(
      client,
      systemPrompt,
      userPrompt,
    );

    await this.aiResultRepository.save({
      input_snapshot: assemblyRecord.result_json as Record<string, unknown>,
      model_used: 'gpt-4o-mini',
      pipeline_step: 'analysis',
      project_id: projectId,
      result_json: analysisResult as unknown as Record<string, unknown>,
    });

    return analysisResult;
  }
}

export default AnalysisService;
