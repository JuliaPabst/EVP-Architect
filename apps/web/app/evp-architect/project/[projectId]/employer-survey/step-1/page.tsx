'use client';

import {Suspense} from 'react';

import {useSearchParams} from 'next/navigation';

import UnunuBackground, {
  UnunuBackgroundColors,
} from '@kununu/ui/atoms/UnunuBackground';

import KununuHeader from '@/app/components/KununuHeader';
// eslint-disable-next-line import/extensions, import/no-unresolved
import useAdminTokenValidation from '@/app/hooks/useAdminTokenValidation';

import Step1Content from './components/Step1Content';
import styles from './page.module.scss';

interface StepPageProps {
  readonly params: {
    readonly projectId: string;
  };
}

export default function EmployerSurveyStep1({params}: StepPageProps) {
  const searchParams = useSearchParams();
  const adminToken = searchParams.get('admin');
  const {isValidating, project} = useAdminTokenValidation(params.projectId, adminToken);

  return (
    <div className={styles.pageWrapper}>
      <div className={styles.backgroundWrapper}>
        <UnunuBackground color={UnunuBackgroundColors.YELLOW} />
      </div>
      <div className={styles.header}>
        <KununuHeader />
      </div>
      <div className={styles.content}>
        {isValidating ? (
          <div>Loading...</div>
        ) : (
          <Suspense fallback={<div>Loading...</div>}>
            <Step1Content 
              adminToken={adminToken}
              companyName={project?.company_name || ''} 
              projectId={params.projectId}
              industry={project?.industry_name}
              location={project?.location}
              logoUrl={project?.profile_image_url}
            />
          </Suspense>
        )}
      </div>
    </div>
  );
}
