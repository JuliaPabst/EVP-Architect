import {EvpQuestionType} from './database';

export interface CompanyContext {
  company_name: string;
  employee_count: string | null;
  industry_name: string | null;
  location: string | null;
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
