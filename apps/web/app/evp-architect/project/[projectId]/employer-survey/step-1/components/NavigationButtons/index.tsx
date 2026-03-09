'use client';

import Button from '@kununu/ui/atoms/Button';
import {ButtonColor, ButtonSize} from '@kununu/ui/shared/typings/button';

import styles from './index.module.scss';

interface NavigationButtonsProps {
  readonly canContinue?: boolean;
  readonly onSave?: () => void;
  readonly onContinue?: () => void;
}

export default function NavigationButtons({
  canContinue = false,
  onSave,
  onContinue,
}: NavigationButtonsProps) {
  return (
    <div className={styles.navigationButtons}>
      <Button
        color={ButtonColor.SECONDARY}
        onClick={onSave}
        size={ButtonSize.M}
        text="Save"
      />
      <Button
        color={ButtonColor.PRIMARY}
        disabled={!canContinue}
        onClick={onContinue}
        size={ButtonSize.M}
        text="Continue"
      />
    </div>
  );
}
