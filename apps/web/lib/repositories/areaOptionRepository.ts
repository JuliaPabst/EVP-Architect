import {supabase} from '@/lib/supabase';

export interface AreaOption {
  readonly key: string;
  readonly label_de: string;
}

/**
 * Repository for area options table operations
 */
export class AreaOptionRepository {
  /**
   * Fetch all area options (for multi_select questions about areas/factors)
   *
   * @returns Array of area options with value_key and label
   */
  async getAllAreaOptions(): Promise<{label: string; value_key: string}[]> {
    const {data, error} = await supabase
      .from('evp_area_options')
      .select('*')
      .order('key', {ascending: true});

    if (error) {
      throw new Error(`Failed to fetch area options: ${error.message}`);
    }

    return (data || []).map(option => ({
      label: option.label_de,
      value_key: option.key,
    }));
  }
}
