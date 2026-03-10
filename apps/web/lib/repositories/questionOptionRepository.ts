import {supabase} from '@/lib/supabase';

export interface QuestionOption {
  readonly question_key: string;
  readonly value_key: string;
  readonly label_de: string;
  readonly position: number;
}

/**
 * Repository for question options table operations
 */
export class QuestionOptionRepository {
  /**
   * Fetch options for specific question keys
   *
   * @param questionKeys - Array of question keys
   * @returns Map of question_key -> array of options ordered by position
   */
  async getOptionsByQuestionKeys(
    questionKeys: readonly string[],
  ): Promise<Map<string, Array<{value_key: string; label: string}>>> {
    if (questionKeys.length === 0) {
      return new Map();
    }

    const {data, error} = await supabase
      .from('evp_question_options')
      .select('*')
      .in('question_key', questionKeys as string[])
      .order('position', {ascending: true});

    if (error) {
      throw new Error(`Failed to fetch question options: ${error.message}`);
    }

    const optionsMap = new Map<
      string,
      Array<{value_key: string; label: string}>
    >();

    for (const option of data || []) {
      const existing = optionsMap.get(option.question_key) || [];

      existing.push({
        label: option.label_de,
        value_key: option.value_key,
      });
      optionsMap.set(option.question_key, existing);
    }

    return optionsMap;
  }
}
