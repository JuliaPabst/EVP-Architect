import {supabase} from '@/lib/supabase';

/**
 * Repository for answer selections join table operations
 * Handles both value and area selections
 */
// eslint-disable-next-line import/prefer-default-export
export class ValueSelectionRepository {
  /**
   * Fetch selected options for multiple answers
   *
   * @param answerIds - Array of answer UUIDs
   * @returns Map of answer_id -> array of option keys
   */
  async getSelectionsByAnswers(
    answerIds: readonly string[],
  ): Promise<Map<string, string[]>> {
    if (answerIds.length === 0) {
      return new Map();
    }

    const {data, error} = await supabase
      .from('evp_answer_selections')
      .select('*')
      .in('answer_id', answerIds as string[])
      .order('position', {ascending: true});

    if (error) {
      throw new Error(`Failed to fetch selections: ${error.message}`);
    }

    const selectionsMap = new Map<string, string[]>();

    for (const selection of data || []) {
      const existing = selectionsMap.get(selection.answer_id) || [];

      existing.push(selection.option_key);
      selectionsMap.set(selection.answer_id, existing);
    }

    return selectionsMap;
  }

  /**
   * Delete all selections for an answer
   *
   * @param answerId - Answer UUID
   */
  async deleteSelectionsByAnswer(answerId: string): Promise<void> {
    const {error} = await supabase
      .from('evp_answer_selections')
      .delete()
      .eq('answer_id', answerId);

    if (error) {
      throw new Error(`Failed to delete selections: ${error.message}`);
    }
  }

  /**
   * Insert selections for an answer
   *
   * @param answerId - Answer UUID
   * @param optionKeys - Array of option keys to insert
   */
  async insertSelections(
    answerId: string,
    optionKeys: readonly string[],
  ): Promise<void> {
    if (optionKeys.length === 0) {
      return;
    }

    const rows = optionKeys.map((optionKey, index) => ({
      answer_id: answerId,
      option_key: optionKey,
      position: index,
    }));

    const {error} = await supabase.from('evp_answer_selections').insert(rows);

    if (error) {
      throw new Error(`Failed to insert selections: ${error.message}`);
    }
  }
}
