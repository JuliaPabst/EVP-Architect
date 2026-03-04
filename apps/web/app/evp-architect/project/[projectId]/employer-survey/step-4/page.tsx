import SurveyStepLayout from '../SurveyStepLayout';

interface StepPageProps {
  readonly params: {
    readonly projectId: string;
  };
}

export default function EmployerSurveyStep4({params}: StepPageProps) {
  return <SurveyStepLayout projectId={params.projectId} stepNumber={4} />;
}
