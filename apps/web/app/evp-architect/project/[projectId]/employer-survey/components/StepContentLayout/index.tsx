import React from 'react';

import SurveyCardHeader from '../SurveyCardHeader';

import styles from './index.module.scss';

interface StepContentLayoutProps {
  readonly children: React.ReactNode;
  readonly currentStep: number;
  readonly isLoading: boolean;
  readonly stepTitle: string;
  readonly error?: string | null;
  readonly totalSteps?: number;
}

/**
 * Common layout wrapper for survey step content
 *
 * Handles loading states, error states, and provides consistent
 * container layout with header for all survey steps.
 *
 * @param children - Step-specific content to render
 * @param currentStep - Current step number
 * @param error - Error message to display
 * @param isLoading - Whether data is being loaded
 * @param stepTitle - Title to display in the header
 * @param totalSteps - Total number of steps (default: 5)
 */
export default function StepContentLayout({
  children,
  currentStep,
  error,
  isLoading,
  stepTitle,
  totalSteps = 5,
}: StepContentLayoutProps) {
  return (
    <div className={styles.stepContent}>
      <div className={styles.container}>
        <SurveyCardHeader
          currentStep={currentStep}
          title={stepTitle}
          totalSteps={totalSteps}
        />

        {isLoading && (
          <div className={styles.loadingMessage}>
            Loading survey questions...
          </div>
        )}

        {error && !isLoading && (
          <div className={styles.errorMessage}>Error: {error}</div>
        )}

        {!isLoading && !error && children}
      </div>
    </div>
  );
}
