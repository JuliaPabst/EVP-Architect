'use client';

import {ReactNode, Suspense} from 'react';

import UnunuBackground, {
  UnunuBackgroundColors,
} from '@kununu/ui/atoms/UnunuBackground';

import styles from './index.module.scss';

import KununuHeader from '@/app/components/KununuHeader';

interface SurveyStepPageWrapperProps {
  readonly children: ReactNode;
  readonly isValidating?: boolean;
}

/**
 * Shared page wrapper for all survey steps (employer and employee).
 * Handles layout, background, and header.
 * Pass isValidating=true to show a loading state (used by employer survey auth).
 */
export default function SurveyStepPageWrapper({
  children,
  isValidating = false,
}: SurveyStepPageWrapperProps) {
  return (
    <div className={styles.pageWrapper}>
      <div className={styles.backgroundWrapper}>
        <UnunuBackground color={UnunuBackgroundColors.YELLOW} />
      </div>
      <div className={styles.header}>
        <KununuHeader />
      </div>
      <main className={styles.content}>
        {isValidating ? (
          <div data-testid="loading">Loading...</div>
        ) : (
          <Suspense fallback={<div>Loading...</div>}>{children}</Suspense>
        )}
      </main>
    </div>
  );
}
