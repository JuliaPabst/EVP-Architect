'use client';

import {useSearchParams} from 'next/navigation';

import SurveyStepPageWrapper from '../components/SurveyStepPageWrapper';

import Step2Content from './components/Step2Content';

interface StepPageProps {
  readonly params: {
    readonly projectId: string;
  };
}

export default function EmployerSurveyStep2({params}: StepPageProps) {
  const searchParams = useSearchParams();
  const adminToken = searchParams.get('admin');

  return (
    <SurveyStepPageWrapper adminToken={adminToken} projectId={params.projectId}>
      <Step2Content adminToken={adminToken} projectId={params.projectId} />
    </SurveyStepPageWrapper>
  );
}
