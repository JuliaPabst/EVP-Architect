import {supabase} from '@/lib/supabase';
import {EvpGenerationComment} from '@/lib/types/database';
import {EvpOutputType} from '@/lib/types/pipeline';

export interface SaveCommentInput {
  comment_text: string;
  output_type: EvpOutputType;
  project_id: string;
}

export class EvpCommentRepository {
  async save(input: SaveCommentInput): Promise<EvpGenerationComment> {
    const {data, error} = await supabase
      .from('evp_generation_comments')
      .insert(input)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to save comment: ${error.message}`);
    }

    return data;
  }

  async findAllByProjectAndOutputType(
    projectId: string,
    outputType: EvpOutputType,
  ): Promise<EvpGenerationComment[]> {
    const {data, error} = await supabase
      .from('evp_generation_comments')
      .select('*')
      .eq('project_id', projectId)
      .eq('output_type', outputType)
      .order('created_at', {ascending: true});

    if (error) {
      throw new Error(`Failed to fetch comments: ${error.message}`);
    }

    return data ?? [];
  }
}
