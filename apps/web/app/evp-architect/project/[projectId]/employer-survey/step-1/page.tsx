'use client';

import {useSearchParams} from 'next/navigation';

import SurveyStepPageWrapper from '../components/SurveyStepPageWrapper';
import Step1Content from './components/Step1Content';

interface StepPageProps {
  readonly params: {
    readonly projectId: string;
  };
}

export default function EmployerSurveyStep1({params}: StepPageProps) {
  const searchParams = useSearchParams();
  const adminToken = searchParams.get('admin');

  return (
    <SurveyStepPageWrapper adminToken={adminToken} projectId={params.projectId}>
      <Step1Content 
        adminToken={adminToken}
        projectId={params.projectId}
      />
    </SurveyStepPageWrapper>
  );
}
