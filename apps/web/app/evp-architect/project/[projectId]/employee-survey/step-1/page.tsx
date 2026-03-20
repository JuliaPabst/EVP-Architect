'use client';

import Step1Content from './components/Step1Content';

import SurveyStepPageWrapper from '@/app/components/survey/SurveyStepPageWrapper';

interface StepPageProps {
  readonly params: {
    readonly projectId: string;
  };
}

export default function EmployeeSurveyStep1({params}: StepPageProps) {
  return (
    <SurveyStepPageWrapper>
      <Step1Content projectId={params.projectId} />
    </SurveyStepPageWrapper>
  );
}
