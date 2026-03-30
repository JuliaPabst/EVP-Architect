import Anthropic from '@anthropic-ai/sdk';

import {callClaude, createAnthropicClient} from '@/lib/llm';
import {AiResultRepository} from '@/lib/repositories/aiResultRepository';
import {
  AssemblyPayload,
  AnalysisResult,
  EvpOutputType,
} from '@/lib/types/pipeline';

// ─── Tone style map ─────────────────────────────────────────────────────────

const TONE_STYLE_MAP: Record<string, string> = {
  casual:
    'Warm, conversational, approachable. Contractions and direct address acceptable.',
  formal:
    'Formal, precise, structured sentences. No colloquialisms. Evidence-forward.',
  friendly_casual:
    'Warm, conversational, approachable. Contractions and direct address acceptable.',
  innovative_future:
    'Dynamic, possibility-forward language. Emphasises change, vision, and momentum.',
  professional_factual:
    'Formal, precise, structured sentences. No colloquialisms. Evidence-forward.',
  traditional_trustworthy:
    'Stable, measured, heritage-focused. Emphasises reliability and continuity.',
};

const DEFAULT_TONE_STYLE = 'Clear, direct, and professional.';

// ─── Tone extraction ────────────────────────────────────────────────────────

function extractTone(assemblyPayload: AssemblyPayload): string | null {
  if (!assemblyPayload.employer_survey) {
    return null;
  }

  const toneAnswer = assemblyPayload.employer_survey.answers.tone_of_voice;

  if (!toneAnswer || toneAnswer.question_type !== 'single_select') {
    return null;
  }

  if (
    'selected_options' in toneAnswer &&
    toneAnswer.selected_options.length > 0
  ) {
    return toneAnswer.selected_options[0].key;
  }

  return null;
}

function getToneStyle(toneKey: string | null): string {
  if (!toneKey) {
    return DEFAULT_TONE_STYLE;
  }

  return TONE_STYLE_MAP[toneKey] ?? DEFAULT_TONE_STYLE;
}

// ─── Prompt builders ────────────────────────────────────────────────────────

function buildInternalEvpSystemPrompt(): string {
  return `You are an expert EVP (Employer Value Proposition) content strategist specializing in authentic employee communication.

Your task is to synthesize the Step 1 analysis into an authentic, insider-facing EVP statement for current employees. This is NOT marketing copy — it is the honest truth about what working here is like, written for people who already work there.

Key principles:
- Write in first-person plural ("we", "us") where appropriate
- Avoid buzzwords, jargon, and generic employer branding language
- Be grounded in the evidence from employee responses — never invent claims
- Celebrate what is genuinely strong, but don't hide reality
- Respect confidence levels from the analysis — if a pillar has low confidence, be tentative
- Do not include tensions, risks, or uncomfortable gaps — those belong in the Gap Analysis

Output ONLY the EVP text, no commentary or explanation.`;
}

function buildInternalEvpUserPrompt(
  analysis: AnalysisResult,
  companyName: string,
): string {
  return `Generate an Internal EVP for ${companyName} based on this Step 1 analysis:

${JSON.stringify(analysis, null, 2)}

The Internal EVP should have these sections:

1. **EVP Core Statement** (2–3 sentences) — The defining promise of working here, written for current employees
2. **What makes us us** — A narrative paragraph describing the lived culture from an insider perspective
3. **Pillar descriptions** — One paragraph per EVP pillar, emphasizing what is genuinely strong
4. **Confidence disclaimer** — A note acknowledging the sample size

Write as though speaking to current employees who already know the company. Be honest and grounded in the evidence.`;
}

function buildExternalEvpSystemPrompt(toneStyle: string): string {
  return `You are an expert EVP (Employer Value Proposition) content strategist specializing in candidate-facing communication.

Your task is to synthesize the Step 1 analysis into an aspirational but authentic External EVP for job seekers and candidates. This EVP should attract talent while staying grounded in real employee experience.

Communication style: ${toneStyle}

Key principles:
- Write for candidates, not employees or HR
- Stay grounded in the evidence from employee responses — never invent claims
- Emphasize strengths backed by data, but do not hide genuine gaps
- Match the tone and register to your target audience if specified
- Respect confidence levels — if a pillar has low confidence, be tentative or omit it
- Do not include tensions, risks, or uncomfortable realities — those belong in the Gap Analysis
- Avoid buzzwords: "dynamic environment", "flat hierarchies", "innovation culture", "disruptive"

Output ONLY the EVP text, no commentary or explanation.`;
}

function buildExternalEvpUserPrompt(
  analysis: AnalysisResult,
  companyName: string,
  targetAudience?: string,
): string {
  const audienceContext = targetAudience
    ? `Target audience: ${targetAudience}. Prioritise pillars and evidence most relevant to this group.`
    : 'Target audience: General candidates';

  return `Generate an External EVP for ${companyName} based on this Step 1 analysis:

${JSON.stringify(analysis, null, 2)}

${audienceContext}

The External EVP should have these sections:

1. **EVP Core Statement** (2–3 sentences) — The employer brand promise for the specified audience
2. **What it feels like to work here** — A narrative paragraph from employee perspective (should feel like a real person wrote it)
3. **Pillar descriptions** — One paragraph per EVP pillar${targetAudience ? ', prioritizing relevance to the target audience' : ''}
4. ${targetAudience ? '**Audience fit note** — A brief note on how well the available evidence maps to the stated audience, flagging any data gaps\n5. ' : ''}**Confidence disclaimer** — A light touch note that the EVP is based on employee input

If a pillar has low confidence or does not align with the evidence, note this explicitly rather than inventing claims.`;
}

function buildGapAnalysisSystemPrompt(): string {
  return `You are an expert EVP analyst and HR strategist. Your task is to produce a Gap Analysis report comparing employer intent against employee reality.

This report is for the HR team and leadership — it is analytical and direct. This is the ONLY output where tensions, blind spots, and uncomfortable truths are surfaced.

Key principles:
- Be analytical and comparative, not narrative
- Surface contradictions between what the employer stated and what employees reported
- Identify blind spots: themes in employee answers that were absent from employer responses
- Flag aspirational gaps: values the employer emphasized that employees did not mention or contradicted
- Provide actionable recommendations for closing the most significant gaps
- Stay grounded in the data — never extrapolate beyond the evidence

Output ONLY the Gap Analysis text, no commentary or explanation.`;
}

function buildGapAnalysisUserPrompt(
  analysis: AnalysisResult,
  companyName: string,
): string {
  return `Generate a Gap Analysis report for ${companyName} based on this Step 1 analysis:

${JSON.stringify(analysis, null, 2)}

The Gap Analysis should have these sections:

1. **Summary** (2–3 sentences) — Overall alignment between employer and employee perspectives
2. **Per-pillar comparison** — For each EVP pillar: employer intent → employee reality → alignment rating (strong / partial / misaligned) → specific evidence from both sides
3. **Blind spots** — Themes in employee answers that were absent from the employer survey
4. **Aspirational gaps** — Values the employer emphasized that employees did not mention or contradicted
5. **Recommendations** — 3–5 brief, actionable suggestions for closing significant gaps

Be direct. This report is for leaders, not candidates.`;
}

// ─── Service class ──────────────────────────────────────────────────────────

/**
 * Service for Step 2 of the EVP AI pipeline: EVP Output Generation.
 *
 * Loads the Step 1 analysis result and generates one of three output types:
 * - Internal EVP (employee-facing, honest, insider tone)
 * - External EVP (candidate-facing, aspirational but grounded, tone-injected)
 * - Gap Analysis (analytical, for HR/leadership, surfaces tensions)
 *
 * Results are saved to evp_ai_results with pipeline_step matching the output_type.
 */
class EvpOutputService {
  private readonly aiResultRepository: AiResultRepository;

  private readonly anthropicClientFactory: () => Anthropic;

  constructor(anthropicClientFactory: () => Anthropic = createAnthropicClient) {
    this.aiResultRepository = new AiResultRepository();
    this.anthropicClientFactory = anthropicClientFactory;
  }

  /**
   * Generate an EVP output (internal, external, or gap analysis).
   *
   * @param projectId - Project UUID
   * @param outputType - One of 'internal', 'external', 'gap_analysis'
   * @param targetAudience - Optional audience for external EVP (e.g. "software engineers")
   * @returns The generated EVP text
   * @throws Error with code 'analysis_not_found' if no Step 1 result exists
   * @throws Error with code 'assembly_not_found' if no Step 0 result exists
   * @throws Error with code 'claude_content_filtered' if Claude output was truncated
   * @throws Other errors for Claude API failures (timeout, rate limit, etc.)
   */
  async generate(
    projectId: string,
    outputType: EvpOutputType,
    targetAudience?: string,
  ): Promise<string> {
    // Load Step 1 analysis
    const analysisRecord = await this.aiResultRepository.findLatestByStep(
      projectId,
      'analysis',
    );

    if (!analysisRecord) {
      throw new Error('analysis_not_found');
    }

    const analysis = analysisRecord.result_json as unknown as AnalysisResult;

    // Load Step 0 assembly (needed for tone extraction, company context)
    const assemblyRecord = await this.aiResultRepository.findLatestByStep(
      projectId,
      'assembly',
    );

    if (!assemblyRecord) {
      throw new Error('assembly_not_found');
    }

    const assemblyPayload =
      assemblyRecord.result_json as unknown as AssemblyPayload;
    const actualCompanyName = assemblyPayload.company_context.company_name;

    // Build and call Claude
    let systemPrompt: string;
    let userPrompt: string;

    if (outputType === 'internal') {
      systemPrompt = buildInternalEvpSystemPrompt();
      userPrompt = buildInternalEvpUserPrompt(analysis, actualCompanyName);
    } else if (outputType === 'external') {
      const toneKey = extractTone(assemblyPayload);
      const toneStyle = getToneStyle(toneKey);

      systemPrompt = buildExternalEvpSystemPrompt(toneStyle);
      userPrompt = buildExternalEvpUserPrompt(
        analysis,
        actualCompanyName,
        targetAudience,
      );
    } else {
      // gap_analysis
      systemPrompt = buildGapAnalysisSystemPrompt();
      userPrompt = buildGapAnalysisUserPrompt(analysis, actualCompanyName);
    }

    const client = this.anthropicClientFactory();
    const outputText = await callClaude(client, systemPrompt, userPrompt);

    // Save result
    await this.aiResultRepository.save({
      input_snapshot: analysisRecord.result_json as Record<string, unknown>,
      model_used: 'claude-sonnet-4-5',
      pipeline_step: outputType,
      project_id: projectId,
      result_text: outputText,
      target_audience: targetAudience ?? null,
    });

    return outputText;
  }
}

export default EvpOutputService;
