'use client';

import Step2Content from './components/Step2Content';

import SurveyStepPageWrapper from '@/app/components/survey/SurveyStepPageWrapper';

interface StepPageProps {
  readonly params: {
    readonly projectId: string;
  };
}

export default function EmployeeSurveyStep2({params}: StepPageProps) {
  return (
    <SurveyStepPageWrapper>
      <Step2Content projectId={params.projectId} />
    </SurveyStepPageWrapper>
  );
}
