import {supabase} from '@/lib/supabase';

/**
 * Repository for value selections join table operations
 */
// eslint-disable-next-line import/prefer-default-export
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

  /**
   * Delete all value selections for an answer
   *
   * @param answerId - Answer UUID
   */
  async deleteSelectionsByAnswer(answerId: string): Promise<void> {
    const {error} = await supabase
      .from('evp_answer_value_selections')
      .delete()
      .eq('answer_id', answerId);

    if (error) {
      throw new Error(`Failed to delete value selections: ${error.message}`);
    }
  }

  /**
   * Insert value selections for an answer
   *
   * @param answerId - Answer UUID
   * @param valueKeys - Array of value keys to insert
   */
  async insertSelections(
    answerId: string,
    valueKeys: readonly string[],
  ): Promise<void> {
    if (valueKeys.length === 0) {
      return;
    }

    const rows = valueKeys.map((valueKey, index) => ({
      answer_id: answerId,
      position: index,
      value_key: valueKey,
    }));

    const {error} = await supabase
      .from('evp_answer_value_selections')
      .insert(rows);

    if (error) {
      throw new Error(`Failed to insert value selections: ${error.message}`);
    }
  }
}
