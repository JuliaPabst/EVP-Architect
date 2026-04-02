'use client';

import useAdminToken from '@/app/hooks/useAdminToken';

import SurveyStepPageWrapper from '../components/SurveyStepPageWrapper';

import Step1Content from './components/Step1Content';

interface StepPageProps {
  readonly params: {
    readonly projectId: string;
  };
}

export default function EmployerSurveyStep1({params}: StepPageProps) {
  const adminToken = useAdminToken(params.projectId);

  return (
    <SurveyStepPageWrapper adminToken={adminToken} projectId={params.projectId}>
      <Step1Content adminToken={adminToken ?? null} projectId={params.projectId} />
    </SurveyStepPageWrapper>
  );
}
