'use client';

import {useSearchParams} from 'next/navigation';

import SurveyStepPageWrapper from '../components/SurveyStepPageWrapper';

interface StepPageProps {
  readonly params: {
    readonly projectId: string;
  };
}

export default function EmployerSurveyStep3({params}: StepPageProps) {
  const searchParams = useSearchParams();
  const adminToken = searchParams.get('admin');

  return (
    <SurveyStepPageWrapper adminToken={adminToken} projectId={params.projectId}>
      <div style={{padding: '2rem', textAlign: 'center'}}>
        <h1>Step 3 - Coming Soon</h1>
        <p>This step will be implemented in a future story.</p>
      </div>
    </SurveyStepPageWrapper>
  );
}
