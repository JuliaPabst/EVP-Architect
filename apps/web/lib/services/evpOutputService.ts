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
  casual: 'Warm, conversational, approachable. Contractions allowed.',
  formal: 'Formal, precise, structured. No colloquialisms.',
  friendly_casual: 'Warm, conversational, approachable. Contractions allowed.',
  innovative_future:
    'Forward-looking, dynamic, focused on growth and momentum.',
  professional_factual: 'Clear, structured, evidence-focused.',
  traditional_trustworthy:
    'Stable, measured, focused on reliability and continuity.',
};

const DEFAULT_TONE_STYLE = 'Clear, direct, professional.';

// ─── Tone extraction ────────────────────────────────────────────────────────

function extractTone(assemblyPayload: AssemblyPayload): string | null {
  if (!assemblyPayload.employer_survey) return null;

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
  if (!toneKey) return DEFAULT_TONE_STYLE;
  return TONE_STYLE_MAP[toneKey] ?? DEFAULT_TONE_STYLE;
}

// ─── Comment formatting ─────────────────────────────────────────────────────

function formatComments(comments: string[]): string {
  if (comments.length === 0) return '';

  const numbered = comments.map((c, i) => `${i + 1}. ${c}`).join('\n');

  return `\n\n## Revision instructions:\n${numbered}\nApply all non-conflicting feedback.`;
}

// ─── Prompt helpers ─────────────────────────────────────────────────────────

function formatLanguageInstruction(language?: string): string {
  if (!language) return '';

  const languageNames: Record<string, string> = {
    de: 'German',
    en: 'English',
  };

  const languageName = languageNames[language] ?? language;

  return `\n\nWrite the entire output in ${languageName}.`;
}

// ─── INTERNAL EVP ───────────────────────────────────────────────────────────

function buildInternalEvpSystemPrompt(language?: string): string {
  return `You are an expert EVP strategist writing for employees.

Create an internal EVP that feels recognisable, grounded, and affirming.

Rules:
- Base everything strictly on the provided evidence
- Do not invent claims
- Do not surface tensions or criticism
- Focus on what is genuinely strong and experienced
- Avoid generic employer branding language
- Use "we" where appropriate
- Do not repeat ideas across sections
- Do not use em dashes

Length constraints:
- Total max 220 words
- Claim: max 6 words
- Core statement: max 45 words
- Pillars: 2 to 4 only, each max 60 words
- Confidence note: 1 short sentence (max 20 words)

Each pillar must introduce a new idea not already mentioned.

Output only the EVP text.${formatLanguageInstruction(language)}`;
}

function buildInternalEvpUserPrompt(
  analysis: AnalysisResult,
  companyName: string,
  comments: string[] = [],
): string {
  return `Create an Internal EVP for ${companyName} based on this analysis:

${JSON.stringify(analysis, null, 2)}

Structure:

1. Claim  
2. Core Statement  
3. Pillars (2–4 strongest only)  
4. Confidence note  

Select only the strongest evidence-backed themes. Omit weak or unsupported areas.

Avoid repeating themes across sections.${formatComments(comments)}`;
}

// ─── EXTERNAL EVP ───────────────────────────────────────────────────────────

function buildExternalEvpSystemPrompt(
  toneStyle: string,
  language?: string,
): string {
  return `You are an expert EVP strategist writing for candidates.

Your goal: attract the right candidates while staying grounded in reality.

Communication style: ${toneStyle}

Rules:
- Base everything strictly on employee evidence
- Do not invent claims
- Allow light realism: do not overpromise, but do not state criticism explicitly
- If evidence is weak, omit the theme rather than generalising
- Help candidates self-select through specificity
- Avoid generic phrases (e.g. "dynamic environment", "flat hierarchies")
- Do not repeat ideas across sections
- Do not use em dashes

Length constraints:
- Total max 220 words
- Claim: max 6 words
- Core statement: max 45 words
- Pillars: 2 to 4 only, each max 60 words
- Confidence note: 1 short sentence (max 20 words)

Each pillar must introduce a new idea not already used earlier.

Output only the EVP text.${formatLanguageInstruction(language)}`;
}

function buildExternalEvpUserPrompt(
  analysis: AnalysisResult,
  companyName: string,
  targetAudience?: string,
  comments: string[] = [],
): string {
  const audienceContext = targetAudience
    ? `Target audience: ${targetAudience}. Prioritise what matters most to them.`
    : `No specific audience. Focus on the most distinctive strengths.`;

  return `Create an External EVP for ${companyName}:

${JSON.stringify(analysis, null, 2)}

${audienceContext}

Structure:

1. Claim  
2. Core Statement  
3. Pillars (2–4 strongest only)  
4. Confidence note  

Select only strong, evidence-backed themes. Omit weak areas instead of generalising.

Avoid repeating ideas across sections.${formatComments(comments)}`;
}

// ─── GAP ANALYSIS ───────────────────────────────────────────────────────────

function buildGapAnalysisSystemPrompt(language?: string): string {
  return `You are an EVP analyst writing for leadership.

Surface gaps between employer intent and employee reality.

Rules:
- Be direct and analytical
- Base everything strictly on evidence
- Compare employer vs employee perspectives
- Identify misalignment, blind spots, and risks
- Provide actionable recommendations
- Do not use em dashes

Length guidance:
- Summary: max 80 words
- Analyse up to 4 most relevant dimensions (not all 5 if unnecessary)
- Recommendations: exactly 3 concise actions

Output only the analysis.${formatLanguageInstruction(language)}`;
}

function buildGapAnalysisUserPrompt(
  analysis: AnalysisResult,
  companyName: string,
  comments: string[] = [],
): string {
  return `Create a Gap Analysis for ${companyName}:

${JSON.stringify(analysis, null, 2)}

Structure:

1. Summary  
2. Per-pillar comparison (top 4 only)  
3. Blind spots  
4. Aspirational gaps  
5. Recommendations (exactly 3)  

Be precise and evidence-based.${formatComments(comments)}`;
}

// ─── SERVICE ────────────────────────────────────────────────────────────────

class EvpOutputService {
  private readonly aiResultRepository: AiResultRepository;

  private readonly anthropicClientFactory: () => Anthropic;

  constructor(anthropicClientFactory: () => Anthropic = createAnthropicClient) {
    this.aiResultRepository = new AiResultRepository();
    this.anthropicClientFactory = anthropicClientFactory;
  }

  async generate(
    projectId: string,
    outputType: EvpOutputType,
    targetAudience?: string,
    comments?: string[],
    toneOfVoice?: string,
    language?: string,
  ): Promise<string> {
    const analysisRecord = await this.aiResultRepository.findLatestByStep(
      projectId,
      'analysis',
    );

    if (!analysisRecord) throw new Error('analysis_not_found');

    const analysis = analysisRecord.result_json as AnalysisResult;

    const assemblyRecord = await this.aiResultRepository.findLatestByStep(
      projectId,
      'assembly',
    );

    if (!assemblyRecord) throw new Error('assembly_not_found');

    const assemblyPayload = assemblyRecord.result_json as AssemblyPayload;
    const companyName = assemblyPayload.company_context.company_name;

    const commentArray = comments ?? [];

    let systemPrompt: string;
    let userPrompt: string;

    if (outputType === 'internal') {
      systemPrompt = buildInternalEvpSystemPrompt(language);
      userPrompt = buildInternalEvpUserPrompt(
        analysis,
        companyName,
        commentArray,
      );
    } else if (outputType === 'external') {
      const toneKey = toneOfVoice ?? extractTone(assemblyPayload);
      const toneStyle = getToneStyle(toneKey);

      systemPrompt = buildExternalEvpSystemPrompt(toneStyle, language);
      userPrompt = buildExternalEvpUserPrompt(
        analysis,
        companyName,
        targetAudience,
        commentArray,
      );
    } else {
      systemPrompt = buildGapAnalysisSystemPrompt(language);
      userPrompt = buildGapAnalysisUserPrompt(
        analysis,
        companyName,
        commentArray,
      );
    }

    const client = this.anthropicClientFactory();
    const outputText = await callClaude(client, systemPrompt, userPrompt);

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
