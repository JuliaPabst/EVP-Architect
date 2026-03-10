export type SurveyType = 'employer' | 'employee';
export type QuestionType = 'text' | 'long_text' | 'single_select' | 'multi_select';
export type SubmissionStatus = 'in_progress' | 'submitted';

export interface SurveyQuestion {
  readonly created_at: string;
  readonly help_text: string | null;
  readonly id: string;
  readonly key: string;
  readonly position: number;
  readonly prompt: string;
  readonly question_type: QuestionType;
  readonly selection_limit: number | null;
  readonly step: number;
  readonly survey_type: SurveyType;
}

export interface SurveySubmission {
  readonly id: string;
  readonly project_id: string;
  readonly respondent_meta: Record<string, unknown>;
  readonly started_at: string;
  readonly status: SubmissionStatus;
  readonly submitted_at: string | null;
  readonly survey_type: SurveyType;
}

export interface SurveyAnswer {
  readonly answer_json: Record<string, unknown> | null;
  readonly answer_text: string | null;
  readonly created_at: string;
  readonly id: string;
  readonly question_id: string;
  readonly submission_id: string;
  readonly updated_at: string;
}

export interface ValueSelection {
  readonly answer_id: string;
  readonly position: number | null;
  readonly value_key: string;
}

export interface QuestionWithAnswer {
  readonly answer: {
    readonly text?: string;
    readonly values?: readonly string[];
  } | null;
  readonly id: string;
  readonly key: string;
  readonly prompt: string;
  readonly question_type: string;
  readonly selection_limit: number | null;
}

export interface StepResponse {
  readonly questions: readonly QuestionWithAnswer[];
  readonly step: number;
}
