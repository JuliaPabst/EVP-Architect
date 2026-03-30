import {AiResultRepository} from '@/lib/repositories/aiResultRepository';
import {ProjectRepository} from '@/lib/repositories/projectRepository';
import {QuestionOptionRepository} from '@/lib/repositories/questionOptionRepository';
import {SelectionOptionRepository} from '@/lib/repositories/selectionOptionRepository';
import {SurveyAnswerRepository} from '@/lib/repositories/surveyAnswerRepository';
import {SurveySubmissionRepository} from '@/lib/repositories/surveySubmissionRepository';
import {ValueSelectionRepository} from '@/lib/repositories/valueSelectionRepository';
import {supabase} from '@/lib/supabase';
import {
  AssemblyPayload,
  CompanyContext,
  DataQualitySummary,
  EmployeeAnswer,
  EmployerAnswer,
  EmployerSurveyData,
} from '@/lib/types/pipeline';
import {SurveySubmission} from '@/lib/types/survey';

export const MINIMUM_EMPLOYEE_SUBMISSIONS = 3;

/**
 * Service for assembling survey data into a structured payload for the AI pipeline.
 *
 * Queries all submitted survey data for a project and produces a clean, structured
 * payload that downstream AI steps (analysis, internal, external, gap_analysis) consume.
 */
class DataAssemblyService {
  private readonly aiResultRepository: AiResultRepository;

  private readonly answerRepository: SurveyAnswerRepository;

  private readonly projectRepository: ProjectRepository;

  private readonly questionOptionRepository: QuestionOptionRepository;

  private readonly selectionOptionRepository: SelectionOptionRepository;

  private readonly submissionRepository: SurveySubmissionRepository;

  private readonly valueSelectionRepository: ValueSelectionRepository;

  constructor() {
    this.aiResultRepository = new AiResultRepository();
    this.answerRepository = new SurveyAnswerRepository();
    this.projectRepository = new ProjectRepository();
    this.questionOptionRepository = new QuestionOptionRepository();
    this.selectionOptionRepository = new SelectionOptionRepository();
    this.submissionRepository = new SurveySubmissionRepository();
    this.valueSelectionRepository = new ValueSelectionRepository();
  }

  /**
   * Assemble all survey data for a project into a structured AI pipeline payload.
   *
   * Fetches employer + employee submissions, aggregates answers, resolves option labels,
   * computes data quality metrics, and saves the result to evp_ai_results.
   *
   * @param projectId - Project UUID
   * @returns The assembled payload saved to evp_ai_results
   * @throws Error with code 'insufficient_submissions' if fewer than 3 employee submissions exist
   * @throws Error with code 'project_not_found' if the project does not exist
   */
  async assemble(projectId: string): Promise<AssemblyPayload> {
    // 1. Fetch project and resolve industry name in parallel
    const project = await this.projectRepository.findById(projectId);

    if (!project) {
      throw new Error('project_not_found');
    }

    const industryNamePromise = project.industry
      ? DataAssemblyService.resolveIndustryName(project.industry)
      : Promise.resolve(null);

    // 2. Fetch all submissions for the project
    const allSubmissions =
      await this.submissionRepository.findAllByProject(projectId);

    const employerSubmissions = allSubmissions.filter(
      s => s.survey_type === 'employer',
    );
    const allEmployeeSubmissions = allSubmissions.filter(
      s => s.survey_type === 'employee',
    );
    const submittedEmployeeSubmissions = allEmployeeSubmissions.filter(
      s => s.status === 'submitted',
    );

    // 3. Enforce minimum threshold
    if (submittedEmployeeSubmissions.length < MINIMUM_EMPLOYEE_SUBMISSIONS) {
      throw new Error('insufficient_submissions');
    }

    const submittedEmployerSubmission =
      employerSubmissions.find(s => s.status === 'submitted') ?? null;

    // 4. Compute completion rate
    const completionRate =
      allEmployeeSubmissions.length > 0
        ? submittedEmployeeSubmissions.length / allEmployeeSubmissions.length
        : 0;

    // 5. Collect all submission IDs to query answers in one pass
    const submittedEmployeeIds = submittedEmployeeSubmissions.map(s => s.id);
    const allRelevantIds = submittedEmployerSubmission
      ? [...submittedEmployeeIds, submittedEmployerSubmission.id]
      : submittedEmployeeIds;

    // 6. Fetch all answers with question context in one query
    const allAnswers =
      await this.answerRepository.getAnswersWithQuestions(allRelevantIds);

    // Separate employer vs employee answers
    const employerAnswerRows = submittedEmployerSubmission
      ? allAnswers.filter(
          a => a.submission_id === submittedEmployerSubmission.id,
        )
      : [];
    const employeeAnswerRows = allAnswers.filter(a =>
      submittedEmployeeIds.includes(a.submission_id),
    );

    // 7. Fetch all selections for select-type answers in one query
    const allAnswerIds = allAnswers
      .filter(a => {
        const qt = a.question.question_type;

        return qt === 'single_select' || qt === 'multi_select';
      })
      .map(a => a.id);

    const selectionsMap =
      await this.valueSelectionRepository.getSelectionsByAnswers(allAnswerIds);

    // 8. Resolve option labels
    // single_select uses evp_question_options (per-question specific options)
    // multi_select uses evp_selection_options (global option library)
    const singleSelectQuestionKeys = [
      ...new Set(
        allAnswers
          .filter(a => a.question.question_type === 'single_select')
          .map(a => a.question.key),
      ),
    ];
    const allSelectedOptionKeys = [
      ...new Set(
        allAnswers
          .filter(a => a.question.question_type === 'multi_select')
          .flatMap(a => selectionsMap.get(a.id) ?? []),
      ),
    ];

    const [questionOptionsMap, selectionOptionsList, industryName] =
      await Promise.all([
        this.questionOptionRepository.getOptionsByQuestionKeys(
          singleSelectQuestionKeys,
        ),
        allSelectedOptionKeys.length > 0
          ? this.selectionOptionRepository.getOptionsByKeys(
              allSelectedOptionKeys,
            )
          : Promise.resolve([]),
        industryNamePromise,
      ]);

    // Build a flat map: option_key → label_de for multi_select options
    const selectionOptionLabels = new Map(
      selectionOptionsList.map(o => [o.key, o.label_de]),
    );

    // 9. Build employer survey data
    const employerSurveyData = DataAssemblyService.buildEmployerSurveyData(
      submittedEmployerSubmission,
      employerAnswerRows,
      selectionsMap,
      questionOptionsMap,
      selectionOptionLabels,
    );

    // 10. Build aggregated employee survey data
    const employeeSurveyData = DataAssemblyService.buildEmployeeSurveyData(
      employeeAnswerRows,
      selectionsMap,
      questionOptionsMap,
      selectionOptionLabels,
    );

    // 11. Data quality summary
    const dataQuality = DataAssemblyService.buildDataQuality(
      submittedEmployeeSubmissions.length,
      completionRate,
      employeeAnswerRows,
    );

    // 12. Assemble the full payload
    const companyContext: CompanyContext = {
      company_name: project.company_name,
      employee_count: project.employee_count ?? null,
      industry_name: industryName,
      location: project.location ?? null,
    };

    const payload: AssemblyPayload = {
      company_context: companyContext,
      data_quality: dataQuality,
      employee_survey: employeeSurveyData,
      employer_survey: employerSurveyData,
      project_id: projectId,
    };

    // 13. Save to evp_ai_results
    await this.aiResultRepository.save({
      input_snapshot: {},
      model_used: 'data_assembly',
      pipeline_step: 'assembly',
      project_id: projectId,
      result_json: payload as unknown as Record<string, unknown>,
    });

    return payload;
  }

  /**
   * Build employer survey data from a single submitted submission.
   * Returns null if no submitted employer submission exists.
   */
  private static buildEmployerSurveyData(
    submission: SurveySubmission | null,
    answerRows: Awaited<
      ReturnType<SurveyAnswerRepository['getAnswersWithQuestions']>
    >,
    selectionsMap: Map<string, string[]>,
    questionOptionsMap: Map<string, {label: string; value_key: string}[]>,
    selectionOptionLabels: Map<string, string>,
  ): EmployerSurveyData | null {
    if (!submission) {
      return null;
    }

    const answers: Record<string, EmployerAnswer> = {};

    for (const row of answerRows) {
      const {question} = row;
      const qt = question.question_type;

      if (qt === 'text' || qt === 'long_text') {
        answers[question.key] = {
          prompt: question.prompt,
          question_type: qt,
          text: row.answer_text,
        };
      } else {
        // single_select or multi_select
        const selectedKeys = selectionsMap.get(row.id) ?? [];
        const selectedOptions = selectedKeys.map(key => ({
          key,
          label_de: DataAssemblyService.resolveOptionLabel(
            qt,
            question.key,
            key,
            questionOptionsMap,
            selectionOptionLabels,
          ),
        }));

        answers[question.key] = {
          prompt: question.prompt,
          question_type: qt,
          selected_options: selectedOptions,
        };
      }
    }

    return {
      answers,
      submission_id: submission.id,
      submitted_at: submission.submitted_at ?? null,
    };
  }

  /**
   * Build aggregated employee survey data across all submitted submissions.
   *
   * - text/long_text: collects all non-null responses
   * - single_select/multi_select: counts option frequencies and computes percentages
   *   (percentage = count / number of submissions that answered this question)
   */
  private static buildEmployeeSurveyData(
    answerRows: Awaited<
      ReturnType<SurveyAnswerRepository['getAnswersWithQuestions']>
    >,
    selectionsMap: Map<string, string[]>,
    questionOptionsMap: Map<string, {label: string; value_key: string}[]>,
    selectionOptionLabels: Map<string, string>,
  ): Record<string, EmployeeAnswer> {
    // Group answers by question key
    const byQuestionKey = new Map<
      string,
      Awaited<ReturnType<SurveyAnswerRepository['getAnswersWithQuestions']>>
    >();

    for (const row of answerRows) {
      const existing = byQuestionKey.get(row.question.key) ?? [];

      existing.push(row);
      byQuestionKey.set(row.question.key, existing);
    }

    const result: Record<string, EmployeeAnswer> = {};

    for (const [questionKey, rows] of byQuestionKey) {
      const {question} = rows[0];
      const qt = question.question_type;

      if (qt === 'text' || qt === 'long_text') {
        const responses = rows
          .map(r => r.answer_text)
          .filter((t): t is string => t !== null && t.trim().length > 0);

        result[questionKey] = {
          prompt: question.prompt,
          question_type: qt,
          responses,
        };
      } else {
        // Aggregate option frequencies
        const optionCounts = new Map<string, number>();

        for (const row of rows) {
          const selectedKeys = selectionsMap.get(row.id) ?? [];

          for (const key of selectedKeys) {
            optionCounts.set(key, (optionCounts.get(key) ?? 0) + 1);
          }
        }

        // Percentage denominator: number of submissions that answered this question
        const answeredCount = rows.length;

        const options = [...optionCounts.entries()]
          .sort(([a], [b]) => a.localeCompare(b))
          .map(([key, count]) => ({
            count,
            key,
            label_de: DataAssemblyService.resolveOptionLabel(
              qt,
              questionKey,
              key,
              questionOptionsMap,
              selectionOptionLabels,
            ),
            percentage: answeredCount > 0 ? count / answeredCount : 0,
          }));

        result[questionKey] = {
          options,
          prompt: question.prompt,
          question_type: qt,
        };
      }
    }

    return result;
  }

  /**
   * Compile data quality summary.
   *
   * - total_submissions: number of submitted employee submissions
   * - completion_rate: submitted / (submitted + in_progress) across all employee submissions
   * - questions_below_threshold: question keys where fewer than 3 submissions provided an answer
   */
  private static buildDataQuality(
    totalSubmissions: number,
    completionRate: number,
    answerRows: Awaited<
      ReturnType<SurveyAnswerRepository['getAnswersWithQuestions']>
    >,
  ): DataQualitySummary {
    // Count distinct submissions per question key
    const answerCountByQuestion = new Map<string, Set<string>>();

    for (const row of answerRows) {
      const set =
        answerCountByQuestion.get(row.question.key) ?? new Set<string>();

      set.add(row.submission_id);
      answerCountByQuestion.set(row.question.key, set);
    }

    // All question keys observed across employee answers
    const allQuestionKeys = [...answerCountByQuestion.keys()];

    const questionsBelowThreshold = allQuestionKeys.filter(key => {
      const count = answerCountByQuestion.get(key)?.size ?? 0;

      return count < MINIMUM_EMPLOYEE_SUBMISSIONS;
    });

    return {
      completion_rate: Math.round(completionRate * 100) / 100,
      questions_below_threshold: questionsBelowThreshold.sort(),
      total_submissions: totalSubmissions,
    };
  }

  /**
   * Resolve a human-readable label for an option key.
   *
   * - single_select: looks up evp_question_options (question-specific)
   * - multi_select: looks up evp_selection_options (global library)
   */
  private static resolveOptionLabel(
    questionType: 'multi_select' | 'single_select',
    questionKey: string,
    optionKey: string,
    questionOptionsMap: Map<string, {label: string; value_key: string}[]>,
    selectionOptionLabels: Map<string, string>,
  ): string {
    if (questionType === 'single_select') {
      const options = questionOptionsMap.get(questionKey) ?? [];
      const found = options.find(o => o.value_key === optionKey);

      return found?.label ?? optionKey;
    }

    return selectionOptionLabels.get(optionKey) ?? optionKey;
  }

  /**
   * Resolve industry name from the industries table.
   */
  private static async resolveIndustryName(
    industryId: number,
  ): Promise<string | null> {
    const {data, error} = await supabase
      .from('industries')
      .select('name')
      .eq('id', industryId)
      .maybeSingle();

    if (error || !data) {
      return null;
    }

    return data.name;
  }
}

export default DataAssemblyService;
