'use client';

import {Suspense} from 'react';

import UnunuBackground, {
  UnunuBackgroundColors,
} from '@kununu/ui/atoms/UnunuBackground';

import KununuHeader from '@/app/components/KununuHeader';

import Step1Content from './components/Step1Content';
import styles from './page.module.scss';

interface StepPageProps {
  readonly params: {
    readonly projectId: string;
  };
}

export default function EmployerSurveyStep1({params}: StepPageProps) {
  return (
    <div className={styles.pageWrapper}>
      <div className={styles.backgroundWrapper}>
        <UnunuBackground color={UnunuBackgroundColors.YELLOW} />
      </div>
      <div className={styles.header}>
        <KununuHeader />
      </div>
      <div className={styles.content}>
        <Suspense fallback={<div>Loading...</div>}>
          <Step1Content companyName="Expedia Group" projectId={params.projectId} />
        </Suspense>
      </div>
    </div>
  );
}
