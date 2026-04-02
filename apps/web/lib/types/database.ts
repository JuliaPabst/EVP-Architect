// Auto-generated from Supabase project: EVP-Architect (jntjnblkgvrjgdtjxffy)
// Generated: 2026-03-27

export type EvpProjectStatus =
  | 'employer_survey_in_progress'
  | 'employer_survey_completed'
  | 'employee_survey_active'
  | 'evp_generation_available'
  | 'evp_generated';

export type EvpSurveyType = 'employer' | 'employee';

export type EvpQuestionType =
  | 'text'
  | 'long_text'
  | 'single_select'
  | 'multi_select';

export type EvpSubmissionStatus = 'in_progress' | 'submitted';

export type EvpSelectionOptionType = 'value' | 'area';

export type EvpPipelineStep =
  | 'assembly'
  | 'analysis'
  | 'internal'
  | 'external'
  | 'gap_analysis';

// public.evp_ai_results
export interface EvpAiResult {
  generated_at: string;
  id: string;
  input_snapshot: Record<string, unknown>;
  model_used: string;
  pipeline_step: EvpPipelineStep;
  project_id: string;
  result_json: Record<string, unknown> | null;
  result_text: string | null;
  target_audience: string | null;
}

// public.evp_projects
export interface EvpProject {
  admin_token: string | null;
  admin_token_created_at: string | null;
  company_name: string;
  created_at: string | null;
  employee_count: string | null;
  id: string;
  industry: number | null;
  location: string | null;
  profile_image_url: string | null;
  profile_url: string;
  profile_uuid: string | null;
  status: EvpProjectStatus;
  survey_token: string | null;
  survey_token_created_at: string | null;
  updated_at: string | null;
}

// public.industries
export interface Industry {
  id: number;
  name: string | null;
  permalink: string | null;
  translation_key: string | null;
  xing_id: string | null;
  xing_name: string | null;
}

// public.evp_survey_questions
export interface EvpSurveyQuestion {
  created_at: string | null;
  help_text: string | null;
  id: string;
  key: string;
  position: number;
  prompt: string;
  question_type: EvpQuestionType;
  selection_limit: number | null;
  step: number;
  survey_type: EvpSurveyType;
}

// public.evp_survey_submissions
export interface EvpSurveySubmission {
  id: string;
  project_id: string;
  respondent_meta: Record<string, unknown>;
  started_at: string | null;
  status: EvpSubmissionStatus;
  submitted_at: string | null;
  survey_type: EvpSurveyType;
}

// public.evp_survey_answers
export interface EvpSurveyAnswer {
  answer_json: unknown;
  answer_text: string | null;
  created_at: string | null;
  id: string;
  question_id: string;
  submission_id: string;
  updated_at: string | null;
}

// public.evp_answer_selections
export interface EvpAnswerSelection {
  answer_id: string;
  option_key: string;
  position: number | null;
}

// public.evp_question_options
export interface EvpQuestionOption {
  created_at: string | null;
  label_de: string;
  position: number;
  question_key: string;
  value_key: string;
}

// public.evp_selection_options
export interface EvpSelectionOption {
  created_at: string | null;
  key: string;
  label_de: string;
  option_type: EvpSelectionOptionType;
}

// public.evp_generation_comments
export interface EvpGenerationComment {
  comment_text: string;
  created_at: string;
  id: string;
  output_type: 'external' | 'gap_analysis' | 'internal';
  project_id: string;
}

// Database schema map
export interface Database {
  public: {
    Tables: {
      evp_ai_results: EvpAiResult;
      evp_answer_selections: EvpAnswerSelection;
      evp_generation_comments: EvpGenerationComment;
      evp_projects: EvpProject;
      evp_question_options: EvpQuestionOption;
      evp_selection_options: EvpSelectionOption;
      evp_survey_answers: EvpSurveyAnswer;
      evp_survey_questions: EvpSurveyQuestion;
      evp_survey_submissions: EvpSurveySubmission;
      industries: Industry;
    };
  };
}
