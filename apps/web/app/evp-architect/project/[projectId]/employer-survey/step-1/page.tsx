'use client';

import {Suspense} from 'react';

import KununuHeader from '@/app/components/KununuHeader';

import Step1Content from './components/Step1Content';

interface StepPageProps {
  readonly params: {
    readonly projectId: string;
  };
}

export default function EmployerSurveyStep1({params}: StepPageProps) {
  return (
    <>
      <KununuHeader />
      <Suspense fallback={<div>Loading...</div>}>
        <Step1Content companyName="Expedia Group" projectId={params.projectId} />
      </Suspense>
    </>
  );
}
