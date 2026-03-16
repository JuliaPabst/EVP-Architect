'use client';

import ProgressBar from '@kununu/ui/atoms/ProgressBar';
import {ProgressBarType} from '@kununu/ui/atoms/ProgressBar/typings';

import styles from './index.module.scss';

interface SurveyCardHeaderProps {
  readonly currentStep: number;
  readonly title: string;
  readonly totalSteps: number;
}

/**
 * Reusable card header component for survey steps
 * Displays step progress and title
 */
export default function SurveyCardHeader({
  currentStep,
  title,
  totalSteps,
}: SurveyCardHeaderProps) {
  const progress = (currentStep / totalSteps) * 100;

  return (
    <div className={styles.headerWrapper}>
      <div className={styles.headerInner}>
        <div className={styles.surveyCardHeader}>
          <div className={styles.headerContent}>
            <h1 className={styles.title}>{title}</h1>
            <span className={styles.stepCounter}>
              {currentStep}/{totalSteps}
            </span>
          </div>
          <ProgressBar type={ProgressBarType.INFO} value={progress} />
        </div>
      </div>
    </div>
  );
}
