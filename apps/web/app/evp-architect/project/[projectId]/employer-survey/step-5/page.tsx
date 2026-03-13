'use client';

import {useSearchParams} from 'next/navigation';

import SurveyStepPageWrapper from '../components/SurveyStepPageWrapper';
import Step5Content from './components/Step5Content';

interface StepPageProps {
  readonly params: {
    readonly projectId: string;
  };
}

export default function EmployerSurveyStep5({params}: StepPageProps) {
  const searchParams = useSearchParams();
  const adminToken = searchParams.get('admin');

  return (
    <SurveyStepPageWrapper adminToken={adminToken} projectId={params.projectId}>
      <Step5Content adminToken={adminToken} projectId={params.projectId} />
    </SurveyStepPageWrapper>
  );
}
