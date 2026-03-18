'use client';

import ProgressBar from '@kununu/ui/atoms/ProgressBar';
import {ProgressBarType} from '@kununu/ui/atoms/ProgressBar/typings';
import Close from '@kununu/ui/particles/Icons/System/Close';

import styles from './index.module.scss';

interface ProgressHeaderProps {
  readonly currentStep: number;
  readonly title: string;
  readonly totalSteps: number;
  readonly onBack?: () => void;
}

export default function ProgressHeader({
  currentStep,
  onBack,
  title,
  totalSteps,
}: ProgressHeaderProps) {
  const progress = (currentStep / totalSteps) * 100;

  return (
    <div className={styles.progressHeader}>
      <div className={styles.headerContent}>
        {onBack && (
          <button
            aria-label="Go back"
            className={styles.backButton}
            onClick={onBack}
            type="button"
          >
            <Close />
          </button>
        )}
        <h1 className={styles.title}>{title}</h1>
        <span className={styles.stepCounter}>
          {currentStep}/{totalSteps}
        </span>
      </div>
      <ProgressBar type={ProgressBarType.INFO} value={progress} />
    </div>
  );
}
