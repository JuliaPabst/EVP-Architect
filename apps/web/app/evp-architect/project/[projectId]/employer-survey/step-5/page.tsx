'use client';

import SurveyStepPageWrapper from '../components/SurveyStepPageWrapper';

import Step5Content from './components/Step5Content';

import useAdminToken from '@/app/hooks/useAdminToken';

interface StepPageProps {
  readonly params: {
    readonly projectId: string;
  };
}

export default function EmployerSurveyStep5({params}: StepPageProps) {
  const adminToken = useAdminToken(params.projectId);

  return (
    <SurveyStepPageWrapper adminToken={adminToken} projectId={params.projectId}>
      <Step5Content
        adminToken={adminToken ?? null}
        projectId={params.projectId}
      />
    </SurveyStepPageWrapper>
  );
}
