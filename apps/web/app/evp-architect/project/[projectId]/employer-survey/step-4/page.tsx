'use client';

import SurveyStepPageWrapper from '../components/SurveyStepPageWrapper';

import Step4Content from './components/Step4Content';

import useAdminToken from '@/app/hooks/useAdminToken';

interface StepPageProps {
  readonly params: {
    readonly projectId: string;
  };
}

export default function EmployerSurveyStep4({params}: StepPageProps) {
  const adminToken = useAdminToken(params.projectId);

  return (
    <SurveyStepPageWrapper adminToken={adminToken} projectId={params.projectId}>
      <Step4Content
        adminToken={adminToken ?? null}
        projectId={params.projectId}
      />
    </SurveyStepPageWrapper>
  );
}
