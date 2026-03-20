'use client';

import Step4Content from './components/Step4Content';

import SurveyStepPageWrapper from '@/app/components/survey/SurveyStepPageWrapper';

interface StepPageProps {
  readonly params: {
    readonly projectId: string;
  };
}

export default function EmployeeSurveyStep4({params}: StepPageProps) {
  return (
    <SurveyStepPageWrapper>
      <Step4Content projectId={params.projectId} />
    </SurveyStepPageWrapper>
  );
}
