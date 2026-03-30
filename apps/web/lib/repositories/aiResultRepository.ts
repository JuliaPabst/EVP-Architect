import {supabase} from '@/lib/supabase';
import {EvpAiResult, EvpPipelineStep} from '@/lib/types/database';

export interface SaveAiResultInput {
  input_snapshot: Record<string, unknown>;
  model_used: string;
  pipeline_step: EvpPipelineStep;
  project_id: string;
  result_json?: Record<string, unknown> | null;
  result_text?: string | null;
  target_audience?: string | null;
}

/**
 * Repository for AI pipeline results table operations
 */
export class AiResultRepository {
  /**
   * Save a new AI pipeline result
   *
   * @param input - Result data to save
   * @returns Saved result record
   */
  async save(input: SaveAiResultInput): Promise<EvpAiResult> {
    const {data, error} = await supabase
      .from('evp_ai_results')
      .insert({
        input_snapshot: input.input_snapshot,
        model_used: input.model_used,
        pipeline_step: input.pipeline_step,
        project_id: input.project_id,
        result_json: input.result_json ?? null,
        result_text: input.result_text ?? null,
        target_audience: input.target_audience ?? null,
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to save AI result: ${error.message}`);
    }

    return data;
  }

  /**
   * Find the most recent result for a project and pipeline step
   *
   * @param projectId - Project UUID
   * @param pipelineStep - Pipeline step identifier
   * @returns Most recent result or null if not found
   */
  async findLatestByStep(
    projectId: string,
    pipelineStep: EvpPipelineStep,
  ): Promise<EvpAiResult | null> {
    const {data, error} = await supabase
      .from('evp_ai_results')
      .select('*')
      .eq('project_id', projectId)
      .eq('pipeline_step', pipelineStep)
      .order('generated_at', {ascending: false})
      .limit(1)
      .maybeSingle();

    if (error) {
      throw new Error(`Failed to fetch AI result: ${error.message}`);
    }

    return data;
  }

  /**
   * Find all results for a project, optionally filtered by pipeline step
   *
   * @param projectId - Project UUID
   * @param pipelineStep - Pipeline step identifier (optional)
   * @returns Array of results ordered by generated_at descending
   */
  async findAllByProject(
    projectId: string,
    pipelineStep?: EvpPipelineStep,
  ): Promise<EvpAiResult[]> {
    let query = supabase
      .from('evp_ai_results')
      .select('*')
      .eq('project_id', projectId)
      .order('generated_at', {ascending: false});

    if (pipelineStep) {
      query = query.eq('pipeline_step', pipelineStep);
    }

    const {data, error} = await query;

    if (error) {
      throw new Error(`Failed to fetch AI results: ${error.message}`);
    }

    return data ?? [];
  }
}
