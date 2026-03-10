import {supabase} from '@/lib/supabase';
import {ValueSelection} from '@/lib/types/survey';

/**
 * Repository for value selections join table operations
 */
export class ValueSelectionRepository {
  /**
   * Fetch selected values for multiple answers
   *
   * @param answerIds - Array of answer UUIDs
   * @returns Map of answer_id -> array of value keys
   */
  async getSelectionsByAnswers(
    answerIds: readonly string[],
  ): Promise<Map<string, string[]>> {
    if (answerIds.length === 0) {
      return new Map();
    }

    const {data, error} = await supabase
      .from('evp_answer_value_selections')
      .select('*')
      .in('answer_id', answerIds as string[])
      .order('position', {ascending: true});

    if (error) {
      throw new Error(`Failed to fetch value selections: ${error.message}`);
    }

    const selectionsMap = new Map<string, string[]>();

    for (const selection of data || []) {
      const existing = selectionsMap.get(selection.answer_id) || [];

      existing.push(selection.value_key);
      selectionsMap.set(selection.answer_id, existing);
    }

    return selectionsMap;
  }
}
