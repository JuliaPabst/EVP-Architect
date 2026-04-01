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

// ─── Comment formatting ─────────────────────────────────────────────────────

function formatComments(comments: string[]): string {
  if (comments.length === 0) return '';

  const numbered = comments.map((c, i) => `${i + 1}. ${c}`).join('\n');

  return `\n\n## Revision instructions from previous reviews:\n${numbered}\n\nIf any feedback contradicts earlier comments, prioritize the latest feedback. Apply all feedback that doesn't conflict with newer instructions.`;
}

// ─── Prompt builders ────────────────────────────────────────────────────────

function formatLanguageInstruction(language?: string): string {
  if (!language) return '';

  const languageNames: Record<string, string> = {
    de: 'German',
    en: 'English',
  };

  const languageName = languageNames[language] ?? language;

  return `\n\nLanguage: Write the entire output in ${languageName}.`;
}

function buildInternalEvpSystemPrompt(language?: string): string {
  return `You are an expert EVP (Employer Value Proposition) content strategist specializing in authentic employee communication.

Your task is to synthesize the Step 1 analysis into an authentic, insider-facing EVP for current employees. This is NOT marketing copy — it is the honest truth about what working here is like, written for people who already work there.

An effective internal EVP serves two purposes: it helps current employees articulate what makes this employer unique (their Alleinstellungsmerkmal as an employer), and it reinforces why they chose to stay. It acts as a strategic umbrella — the defining message that ties together all the real experiences, benefits, and values that make this workplace distinct.

The EVP opens with a Claim — a short, memorable phrase that captures the core identity of working here. The Claim is followed by a brief rationale line that cites the evidence behind it, so readers can see it is earned, not invented. The Claim should feel like recognition ("This is who we are"), not a recruitment pitch.

Cover the following EVP dimensions where the evidence supports it:
- Culture and values (how people actually behave and what the organisation stands for)
- Development and growth (learning opportunities, career paths, meaningful challenges)
- Work environment (day-to-day experience, team dynamics, ways of working)
- Compensation and benefits (what employees tangibly receive)
- Purpose and meaning (why the work matters, the company's broader impact)

Key principles:
- Write in first-person plural ("we", "us") where appropriate
- Avoid buzzwords, jargon, and generic employer branding language
- Be grounded in the evidence from employee responses — never invent claims
- Reflect lived reality, not aspirations — an EVP only builds trust if it matches actual experience
- Celebrate what is genuinely strong, but don't hide reality
- Highlight what makes this employer distinct from others in the same market where evidence supports it
- Respect confidence levels from the analysis — if a pillar has low confidence, be tentative
- Do not include tensions, risks, or uncomfortable gaps — those belong in the Gap Analysis
- If office dogs, pets, or animals are mentioned in the evidence, refer to them explicitly by name (e.g. "our office dogs", "the dogs in the office") — never use animal behaviour as a metaphor or indirect reference, as this creates unintended ambiguity

Do not use em dashes (—) anywhere in the output.

Output ONLY the EVP text, no commentary or explanation.${formatLanguageInstruction(language)}`;
}

function buildInternalEvpUserPrompt(
  analysis: AnalysisResult,
  companyName: string,
  comments: string[] = [],
): string {
  return `Generate an Internal EVP for ${companyName} based on this Step 1 analysis:

${JSON.stringify(analysis, null, 2)}

The Internal EVP must follow this structure exactly:

1. **Claim** — A short, memorable phrase (ideally under 8 words) that captures the core identity of working at ${companyName}. It should feel like recognition — "This is who we are" — not a recruitment pitch. It must be grounded in the strongest evidence from the analysis, not invented.
2. **Claim rationale** — One sentence citing the specific evidence that earns the Claim (e.g. which pillar or theme backs it up).
3. **EVP Core Statement** (2–3 sentences) — The defining employer promise in a way current employees would recognise as true. Honest and grounded.
4. **What makes us us** — A narrative paragraph describing the lived culture from an insider perspective, grounded in actual evidence from the analysis.
5. **Pillar descriptions** — One paragraph per EVP pillar, emphasizing what is genuinely strong. Cover all five dimensions (culture/values, development, work environment, compensation/benefits, purpose) only where supported by evidence — omit or be tentative about any dimension with insufficient data.
6. **Confidence disclaimer** — A note acknowledging the sample size.

Write as though speaking to current employees who already know the company. Be honest and grounded in the evidence. The output should make employees feel seen, help them articulate why they work here, and reinforce their sense of belonging.${formatComments(comments)}`;
}

function buildExternalEvpSystemPrompt(
  toneStyle: string,
  language?: string,
): string {
  return `You are an expert EVP (Employer Value Proposition) content strategist specializing in candidate-facing communication.

Your task is to synthesize the Step 1 analysis into an aspirational but authentic External EVP for job seekers and candidates. This EVP should attract the right talent while staying grounded in real employee experience.

An effective external EVP serves two goals simultaneously: it attracts candidates who are a strong cultural fit (Kulturelle Passung), and it helps unsuitable candidates self-select out. Candidates who read this should be able to honestly assess whether this employer's values, culture, and ways of working match their own — before they apply. This means the EVP must be specific and differentiated, not generic.

The EVP opens with a Claim — a short, memorable phrase that captures the employer's core identity and promise. The Claim is followed by a brief rationale line that cites the evidence behind it. Unlike the internal EVP, the external Claim is an invitation: it should make the right candidate lean in and want to know more.

Communication style: ${toneStyle}

Cover the following EVP dimensions where the evidence supports it:
- Culture and values (what the organisation genuinely stands for, how people actually work together)
- Development and growth (what candidates can expect to learn, grow into, or be challenged by)
- Work environment (what day-to-day life looks and feels like)
- Compensation and benefits (concrete offer to candidates)
- Purpose and meaning (why the work matters beyond the day-to-day)

Key principles:
- Write for candidates, not employees or HR
- Stay grounded in the evidence from employee responses — never invent claims
- The EVP must reflect lived reality — an EVP that overpromises destroys trust and increases churn
- Surface what is genuinely distinctive about this employer compared to others in the same space
- Emphasize strengths backed by data, but do not hide genuine gaps
- Match the tone and register to your target audience if specified
- Respect confidence levels — if a pillar has low confidence, be tentative or omit it
- Do not include tensions, risks, or uncomfortable realities — those belong in the Gap Analysis
- Avoid buzzwords: "dynamic environment", "flat hierarchies", "innovation culture", "disruptive"
- If office dogs, pets, or animals are mentioned in the evidence, refer to them explicitly by name (e.g. "our office dogs", "the dogs in the office") — never use animal behaviour as a metaphor or indirect reference, as this creates unintended ambiguity
- Do not use em dashes (—) anywhere in the output.

Output ONLY the EVP text, no commentary or explanation.${formatLanguageInstruction(language)}`;
}

function buildExternalEvpUserPrompt(
  analysis: AnalysisResult,
  companyName: string,
  targetAudience?: string,
  comments: string[] = [],
): string {
  const audienceContext = targetAudience
    ? `Target audience: ${targetAudience}. Prioritise pillars and evidence most relevant to this group. Candidates in this group should be able to use this EVP to decide whether ${companyName} is a good cultural and professional fit for them — make the output specific enough to allow that self-assessment.`
    : 'Target audience: General candidates';

  return `Generate an External EVP for ${companyName} based on this Step 1 analysis:

${JSON.stringify(analysis, null, 2)}

${audienceContext}

The External EVP must follow this structure exactly:

1. **Claim** — A short, memorable phrase (ideally under 8 words) that captures what makes ${companyName} a distinct employer. It should feel like an invitation — making the right candidate lean in and want to know more. It must be grounded in the strongest evidence from the analysis, not invented.
2. **Claim rationale** — One sentence citing the specific evidence that earns the Claim.
3. **EVP Core Statement** (2–3 sentences) — The employer brand promise: specific enough that candidates can assess whether it matches their own values and expectations.
4. **What it feels like to work here** — A narrative paragraph written from an employee perspective (should feel like a real person wrote it, not a press release).
5. **Pillar descriptions** — One paragraph per EVP pillar${targetAudience ? ', prioritizing relevance to the target audience' : ''}. Cover all five dimensions (culture/values, development, work environment, compensation/benefits, purpose) only where supported by evidence.
6. ${targetAudience ? '**Audience fit note** — A brief note on how well the available evidence maps to the stated audience, flagging any data gaps\n7. ' : ''}**Confidence disclaimer** — A light touch note that the EVP is based on employee input.

If a pillar has low confidence or does not align with the evidence, note this explicitly rather than inventing claims. Specificity beats completeness — a shorter EVP grounded in real evidence is better than a full one with invented claims.${formatComments(comments)}`;
}

function buildGapAnalysisSystemPrompt(language?: string): string {
  return `You are an expert EVP analyst and HR strategist. Your task is to produce a Gap Analysis report comparing employer intent against employee reality.

This report is for the HR team and leadership — it is analytical and direct. This is the ONLY output where tensions, blind spots, and uncomfortable truths are surfaced.

A well-developed EVP requires both an internal perspective (what leadership believes the company stands for) and an external/employee perspective (what people actually experience). The gap between these two views is where EVP credibility is won or lost. An EVP that overpromises relative to lived reality damages trust, increases churn, and attracts candidates who will quickly disengage. This report maps that gap so leadership can act on it.

Analyse across the five core EVP dimensions where evidence is available:
- Culture and values
- Development and growth
- Work environment
- Compensation and benefits
- Purpose and meaning

Key principles:
- Be analytical and comparative, not narrative
- Surface contradictions between what the employer stated and what employees reported
- Identify blind spots: themes in employee answers that were absent from employer responses
- Flag aspirational gaps: values the employer emphasized that employees did not mention or contradicted
- Note which gaps represent the highest risk to EVP credibility if left unaddressed
- Provide actionable recommendations for closing the most significant gaps
- Stay grounded in the data — never extrapolate beyond the evidence
- Do not use em dashes (—) anywhere in the output.

Output ONLY the Gap Analysis text, no commentary or explanation.${formatLanguageInstruction(language)}`;
}

function buildGapAnalysisUserPrompt(
  analysis: AnalysisResult,
  companyName: string,
  comments: string[] = [],
): string {
  return `Generate a Gap Analysis report for ${companyName} based on this Step 1 analysis:

${JSON.stringify(analysis, null, 2)}

The Gap Analysis should have these sections:

1. **Summary** (2–3 sentences) — Overall alignment between employer intent and employee reality, and what this means for EVP credibility
2. **Per-pillar comparison** — For each of the five EVP dimensions (culture/values, development, work environment, compensation/benefits, purpose): employer intent → employee reality → alignment rating (strong / partial / misaligned) → specific evidence from both sides. Only include dimensions where evidence exists.
3. **Blind spots** — Themes that appear clearly in employee answers but were absent or underweighted in employer responses. These often reveal what employees actually value most.
4. **Aspirational gaps** — Claims or values the employer emphasized that employees did not confirm or actively contradicted. These are the highest-risk items for EVP credibility.
5. **Recommendations** — 3–5 brief, actionable suggestions for closing the most significant gaps. Prioritize gaps that most undermine EVP authenticity or candidate trust.

Be direct. This report is for leaders, not candidates. Prioritize clarity over diplomacy.${formatComments(comments)}`;
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
   * @param comments - Optional array of reviewer comments to incorporate into the generation
   * @param toneOfVoice - Optional tone override (e.g. 'friendly_casual'). Bypasses DB assembly value.
   * @param language - Optional language override (e.g. 'de', 'en'). Applied to all output types.
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
    comments?: string[],
    toneOfVoice?: string,
    language?: string,
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
    const commentArray = comments ?? [];
    let systemPrompt: string;
    let userPrompt: string;

    if (outputType === 'internal') {
      systemPrompt = buildInternalEvpSystemPrompt(language);
      userPrompt = buildInternalEvpUserPrompt(
        analysis,
        actualCompanyName,
        commentArray,
      );
    } else if (outputType === 'external') {
      const toneKey = toneOfVoice ?? extractTone(assemblyPayload);
      const toneStyle = getToneStyle(toneKey);

      systemPrompt = buildExternalEvpSystemPrompt(toneStyle, language);
      userPrompt = buildExternalEvpUserPrompt(
        analysis,
        actualCompanyName,
        targetAudience,
        commentArray,
      );
    } else {
      // gap_analysis
      systemPrompt = buildGapAnalysisSystemPrompt(language);
      userPrompt = buildGapAnalysisUserPrompt(
        analysis,
        actualCompanyName,
        commentArray,
      );
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
