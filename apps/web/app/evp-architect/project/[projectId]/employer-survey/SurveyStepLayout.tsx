'use client';

import {useEffect, useState} from 'react';

import KununuHeader from '@/app/components/KununuHeader';
import useAdminToken from '@/app/hooks/useAdminToken';
import useAdminTokenValidation from '@/app/hooks/useAdminTokenValidation';

interface SurveyStepLayoutProps {
  readonly projectId: string;
  readonly stepNumber: number;
}

export default function SurveyStepLayout({
  projectId,
  stepNumber,
}: SurveyStepLayoutProps) {
  const [mounted, setMounted] = useState(false);
  const adminToken = useAdminToken(projectId);

  const {companyName, isValidating} = useAdminTokenValidation(
    projectId,
    adminToken,
  );

  useEffect(() => {
    const timer = setTimeout(() => setMounted(true), 0);

    return () => clearTimeout(timer);
  }, []);

  if (!mounted || isValidating) {
    return (
      <div data-testid="loading">
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div data-testid={`employer-survey-step-${stepNumber}`}>
      <KununuHeader />
      <main style={{padding: '2rem'}}>
        <h1>Employer Survey - Step {stepNumber}</h1>
        <p>Company: {companyName}</p>
        <p>This is step {stepNumber} of the employer survey.</p>
        <p>Survey content will be implemented in future stories.</p>
      </main>
    </div>
  );
}
