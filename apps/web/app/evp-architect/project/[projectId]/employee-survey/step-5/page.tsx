'use client';

import Step5Content from './components/Step5Content';

import SurveyStepPageWrapper from '@/app/components/survey/SurveyStepPageWrapper';

interface StepPageProps {
  readonly params: {
    readonly projectId: string;
  };
}

export default function EmployeeSurveyStep5({params}: StepPageProps) {
  return (
    <SurveyStepPageWrapper>
      <Step5Content projectId={params.projectId} />
    </SurveyStepPageWrapper>
  );
}
