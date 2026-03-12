import {supabase} from '@/lib/supabase';

export type OptionType = 'value' | 'area';

export interface SelectionOption {
  readonly key: string;
  readonly label_de: string;
  readonly option_type: OptionType;
}

/**
 * Repository for selection options (unified values and areas)
 */
export class SelectionOptionRepository {
  /**
   * Fetch all selection options
   *
   * @returns Array of all selection options
   */
  async getAllOptions(): Promise<SelectionOption[]> {
    const {data, error} = await supabase
      .from('evp_selection_options')
      .select('*')
      .order('key', {ascending: true});

    if (error) {
      throw new Error(`Failed to fetch selection options: ${error.message}`);
    }

    return data || [];
  }

  /**
   * Fetch selection options by type
   *
   * @param optionType - 'value' or 'area'
   * @returns Array of selection options of specified type
   */
  async getOptionsByType(optionType: OptionType): Promise<SelectionOption[]> {
    const {data, error} = await supabase
      .from('evp_selection_options')
      .select('*')
      .eq('option_type', optionType)
      .order('key', {ascending: true});

    if (error) {
      throw new Error(
        `Failed to fetch ${optionType} options: ${error.message}`,
      );
    }

    return data || [];
  }

  /**
   * Fetch selection options by keys
   *
   * @param keys - Array of option keys
   * @returns Array of selection options
   */
  async getOptionsByKeys(keys: readonly string[]): Promise<SelectionOption[]> {
    if (keys.length === 0) {
      return [];
    }

    const {data, error} = await supabase
      .from('evp_selection_options')
      .select('*')
      .in('key', keys as string[]);

    if (error) {
      throw new Error(`Failed to fetch options by keys: ${error.message}`);
    }

    return data || [];
  }
}
