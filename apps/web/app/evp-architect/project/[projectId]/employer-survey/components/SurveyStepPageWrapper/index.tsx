'use client';

import {ReactNode} from 'react';

import SharedSurveyStepPageWrapper from '@/app/components/survey/SurveyStepPageWrapper';
import useAdminTokenValidation from '@/app/hooks/useAdminTokenValidation';

interface SurveyStepPageWrapperProps {
  readonly adminToken: string | null;
  readonly children: ReactNode;
  readonly projectId: string;
}

/**
 * Employer survey page wrapper.
 * Validates admin token and delegates layout to the shared SurveyStepPageWrapper.
 */
export default function SurveyStepPageWrapper({
  adminToken,
  children,
  projectId,
}: SurveyStepPageWrapperProps) {
  const {isValidating} = useAdminTokenValidation(projectId, adminToken);

  return (
    <SharedSurveyStepPageWrapper isValidating={isValidating}>
      {children}
    </SharedSurveyStepPageWrapper>
  );
}
