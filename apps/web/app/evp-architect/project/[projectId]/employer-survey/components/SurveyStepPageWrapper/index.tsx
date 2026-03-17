'use client';

import {ReactNode, Suspense} from 'react';

import UnunuBackground, {
  UnunuBackgroundColors,
} from '@kununu/ui/atoms/UnunuBackground';

import styles from './index.module.scss';

import KununuHeader from '@/app/components/KununuHeader';
import useAdminTokenValidation from '@/app/hooks/useAdminTokenValidation';

interface SurveyStepPageWrapperProps {
  readonly adminToken: string | null;
  readonly children: ReactNode;
  readonly projectId: string;
}

/**
 * Reusable page wrapper for all employer survey steps
 * Handles layout, background, header, and authentication
 */
export default function SurveyStepPageWrapper({
  adminToken,
  children,
  projectId,
}: SurveyStepPageWrapperProps) {
  const {isValidating} = useAdminTokenValidation(projectId, adminToken);

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
