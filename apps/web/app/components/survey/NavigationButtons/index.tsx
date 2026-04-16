'use client';

import Button from '@kununu/ui/atoms/Button';
import {ButtonColor, ButtonSize} from '@kununu/ui/shared/typings/button';

import styles from './index.module.scss';

interface NavigationButtonsProps {
  readonly canContinue?: boolean;
  readonly continueText?: string;
  readonly onBack?: () => void;
  readonly onContinue?: () => void;
  readonly showBackButton?: boolean;
}

export default function NavigationButtons({
  canContinue = false,
  continueText = 'Continue',
  onBack,
  onContinue,
  showBackButton = false,
}: NavigationButtonsProps) {
  return (
    <div className={styles.navigationButtons}>
      {showBackButton && onBack && (
        <Button
          color={ButtonColor.SECONDARY}
          onClick={onBack}
          size={ButtonSize.M}
          text="Back"
        />
      )}
      <Button
        color={ButtonColor.PRIMARY}
        disabled={!canContinue}
        onClick={onContinue}
        size={ButtonSize.M}
        text={continueText}
      />
    </div>
  );
}
