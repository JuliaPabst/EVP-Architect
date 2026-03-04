'use client';

import {useEffect, useState} from 'react';

import {useSearchParams} from 'next/navigation';

import Header from '@kununu/ui/organisms/Header';
import HeaderLogo from '@kununu/ui/organisms/Header/HeaderLogo';

// eslint-disable-next-line import/extensions, import/no-unresolved
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
  const searchParams = useSearchParams();
  const adminToken = searchParams.get('admin');

  const {companyName, isValidating} = useAdminTokenValidation(
    projectId,
    adminToken,
  );

  useEffect(() => {
    setMounted(true);
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
      <Header
        data-testid="header"
        logo={
          <HeaderLogo
            href="https://www.kununu.com/"
            label="Go to kununu"
            motto="Let's make work better."
          />
        }
      />
      <main style={{padding: '2rem'}}>
        <h1>Employer Survey - Step {stepNumber}</h1>
        <p>Company: {companyName}</p>
        <p>This is step {stepNumber} of the employer survey.</p>
        <p>Survey content will be implemented in future stories.</p>
      </main>
    </div>
  );
}
