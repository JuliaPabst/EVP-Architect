'use client';

import SurveyStepPageWrapper from '@/app/components/survey/SurveyStepPageWrapper';
import Step1Content from './components/Step1Content';

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
