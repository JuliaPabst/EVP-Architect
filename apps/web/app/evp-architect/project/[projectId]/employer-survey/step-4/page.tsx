'use client';

import {useSearchParams} from 'next/navigation';

import SurveyStepPageWrapper from '../components/SurveyStepPageWrapper';
import Step4Content from './components/Step4Content';

interface StepPageProps {
  readonly params: {
    readonly projectId: string;
  };
}

export default function EmployerSurveyStep4({params}: StepPageProps) {
  const searchParams = useSearchParams();
  const adminToken = searchParams.get('admin');

  return (
    <SurveyStepPageWrapper adminToken={adminToken} projectId={params.projectId}>
      <Step4Content 
        adminToken={adminToken}
        projectId={params.projectId}
      />
    </SurveyStepPageWrapper>
  );
}
