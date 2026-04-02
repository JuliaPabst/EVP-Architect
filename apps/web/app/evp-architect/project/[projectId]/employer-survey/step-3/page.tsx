'use client';

import SurveyStepPageWrapper from '../components/SurveyStepPageWrapper';

import Step3Content from './components/Step3Content';

import useAdminToken from '@/app/hooks/useAdminToken';

interface StepPageProps {
  readonly params: {
    readonly projectId: string;
  };
}

export default function EmployerSurveyStep3({params}: StepPageProps) {
  const adminToken = useAdminToken(params.projectId);

  return (
    <SurveyStepPageWrapper adminToken={adminToken} projectId={params.projectId}>
      <Step3Content
        adminToken={adminToken ?? null}
        projectId={params.projectId}
      />
    </SurveyStepPageWrapper>
  );
}
