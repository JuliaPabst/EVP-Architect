'use client';

import SurveyStepPageWrapper from '@/app/components/survey/SurveyStepPageWrapper';
import Step5Content from './components/Step5Content';

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
