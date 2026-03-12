'use client';

import ProgressBar from '@kununu/ui/atoms/ProgressBar';
import {ProgressBarType} from '@kununu/ui/atoms/ProgressBar/typings';
import Close from '@kununu/ui/particles/Icons/System/Close';

import styles from './index.module.scss';

interface SurveyCardHeaderProps {
  readonly currentStep: number;
  readonly totalSteps: number;
  readonly title: string;
  readonly onBack?: () => void;
}

/**
 * Reusable card header component for survey steps
 * Displays step progress, title, and optional back button
 */
export default function SurveyCardHeader({
  currentStep,
  onBack,
  title,
  totalSteps,
}: SurveyCardHeaderProps) {
  const progress = (currentStep / totalSteps) * 100;

  return (
    <div className={styles.headerWrapper}>
      <div className={styles.surveyCardHeader}>
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
    </div>
  );
}
