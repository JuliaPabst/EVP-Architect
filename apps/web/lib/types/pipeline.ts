import {EvpQuestionType} from './database';

export interface CompanyContext {
  company_name: string;
  employee_count: string | null;
  industry_name: string | null;
  location: string | null;
}

// ─── Step 1: Analysis & Synthesis ───────────────────────────────────────────

export interface SharedSignal {
  convergence: 'shared';
  label: string;
  mentioned_by: number;
  out_of: number;
  representative_quote: string;
}

export interface IndividualSignal {
  convergence: 'individual';
  label: string;
  mentioned_by: number;
  out_of: number;
  quote: string;
}

export interface PerQuestionSignal {
  individual_signals: IndividualSignal[];
  question_key: string;
  question_prompt: string;
  shared_signals: SharedSignal[];
  tensions: string[];
}

export interface CrossQuestionPattern {
  description: string;
  evidence_from_questions: string[];
  pattern: string;
}

export interface EvpPillar {
  confidence: 'high' | 'low' | 'medium';
  employee_evidence: string;
  employer_intent_alignment: 'misaligned' | 'partial' | 'strong';
  label: string;
  strength: string;
}

export interface RiskSignal {
  description: string;
  evidence: string;
  severity: string;
}

export interface ValueTension {
  description: string;
  evidence: string;
  severity: string;
}

export interface AnalysisResult {
  cross_question_patterns: CrossQuestionPattern[];
  data_gaps: string[];
  evp_pillars: EvpPillar[];
  per_question_signals: PerQuestionSignal[];
  risk_signals: RiskSignal[];
  sample_size_note: string;
  total_respondents: number;
  value_tensions: ValueTension[];
}

export interface EmployerTextAnswer {
  prompt: string;
  question_type: Extract<EvpQuestionType, 'long_text' | 'text'>;
  text: string | null;
}

export interface EmployerSelectAnswer {
  prompt: string;
  question_type: Extract<EvpQuestionType, 'multi_select' | 'single_select'>;
  selected_options: {
    key: string;
    label_de: string;
  }[];
}

export type EmployerAnswer = EmployerSelectAnswer | EmployerTextAnswer;

export interface EmployerSurveyData {
  answers: Record<string, EmployerAnswer>;
  submission_id: string;
  submitted_at: string | null;
}

export interface EmployeeTextAnswer {
  prompt: string;
  question_type: Extract<EvpQuestionType, 'long_text' | 'text'>;
  responses: string[];
}

export interface EmployeeSelectAnswer {
  options: {
    count: number;
    key: string;
    label_de: string;
    percentage: number;
  }[];
  prompt: string;
  question_type: Extract<EvpQuestionType, 'multi_select' | 'single_select'>;
}

export type EmployeeAnswer = EmployeeSelectAnswer | EmployeeTextAnswer;

export interface DataQualitySummary {
  completion_rate: number;
  questions_below_threshold: string[];
  total_submissions: number;
}

export interface AssemblyPayload {
  company_context: CompanyContext;
  data_quality: DataQualitySummary;
  employee_survey: Record<string, EmployeeAnswer>;
  employer_survey: EmployerSurveyData | null;
  project_id: string;
}

// ─── Step 2: EVP Output Generation ──────────────────────────────────────────

export type EvpOutputType = 'external' | 'gap_analysis' | 'internal';
