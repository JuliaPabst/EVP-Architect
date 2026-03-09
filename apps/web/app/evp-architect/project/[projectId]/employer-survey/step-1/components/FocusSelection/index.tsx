'use client';

import {useState} from 'react';

import ChoiceChip from '@kununu/ui/atoms/ChoiceChip';
import {ChoiceChipSize} from '@kununu/ui/atoms/ChoiceChip/typings';
import SuccessInverted from '@kununu/ui/particles/Icons/System/SuccessInverted';
import {IconColor} from '@kununu/ui/particles/Icons/typings';

import styles from './index.module.scss';

interface FocusOption {
  readonly id: string;
  readonly label: string;
}

interface FocusSelectionProps {
  readonly maxSelections?: number;
  readonly minSelections?: number;
  readonly onChange?: (selected: string[]) => void;
  readonly options: readonly FocusOption[];
  readonly title: string;
}

export default function FocusSelection({
  maxSelections = 20,
  minSelections = 5,
  onChange,
  options,
  title,
}: FocusSelectionProps) {
  const [selectedFactors, setSelectedFactors] = useState<string[]>([]);

  const handleChipChange = (value: string, checked: boolean) => {
    const newSelected = checked
      ? [...selectedFactors, value]
      : selectedFactors.filter((v) => v !== value);

    // Enforce max selections
    if (newSelected.length <= maxSelections) {
      setSelectedFactors(newSelected);
      onChange?.(newSelected);
    }
  };

  const selectedCount = selectedFactors.length;
  const meetsMinimum = selectedCount >= minSelections;

  return (
    <div className={styles.focusSelection}>
      <div className={styles.header}>
        <h2 className={styles.title}>{title}</h2>
        <div className={styles.instructionRow}>
          <span className={styles.instructionText}>Select max. {maxSelections}</span>
          <div className={styles.factorsSelected}>
            <div className={styles.iconWrapper}>
              {meetsMinimum && (
                <div className={styles.successIcon}>
                  <SuccessInverted color={IconColor.GREEN90} />
                </div>
              )}
              {!meetsMinimum && <div className={styles.stepCircle} />}
            </div>
            <span className={styles.instructionText}>
              {selectedCount} factors selected
            </span>
          </div>
        </div>
      </div>
      <div className={styles.tags}>
        {options.map((option) => (
          <ChoiceChip
            checked={selectedFactors.includes(option.id)}
            fitContent
            id={option.id}
            key={option.id}
            name="focus-factors"
            onChange={(e) => handleChipChange(option.id, e.target.checked)}
            size={ChoiceChipSize.L}
            text={option.label}
            value={option.id}
          />
        ))}
      </div>
    </div>
  );
}
