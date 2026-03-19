'use client';

import SurveyStepPageWrapper from '@/app/components/survey/SurveyStepPageWrapper';
import Step2Content from './components/Step2Content';

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
