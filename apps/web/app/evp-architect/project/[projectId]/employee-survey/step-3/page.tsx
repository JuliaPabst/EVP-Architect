'use client';

import SurveyStepPageWrapper from '@/app/components/survey/SurveyStepPageWrapper';
import Step3Content from './components/Step3Content';

interface StepPageProps {
  readonly params: {
    readonly projectId: string;
  };
}

export default function EmployeeSurveyStep3({params}: StepPageProps) {
  return (
    <SurveyStepPageWrapper>
      <Step3Content projectId={params.projectId} />
    </SurveyStepPageWrapper>
  );
}
