import {supabase} from '@/lib/supabase';

export interface ValueOption {
  readonly key: string;
  readonly label_de: string;
}

/**
 * Repository for value options table operations
 */
export class ValueOptionRepository {
  /**
   * Fetch all value options (for multi_select questions)
   *
   * @returns Array of value options with value_key and label
   */
  async getAllValueOptions(): Promise<{label: string; value_key: string}[]> {
    const {data, error} = await supabase
      .from('evp_value_options')
      .select('*')
      .order('key', {ascending: true});

    if (error) {
      throw new Error(`Failed to fetch value options: ${error.message}`);
    }

    return (data || []).map(option => ({
      label: option.label_de,
      value_key: option.key,
    }));
  }
}
