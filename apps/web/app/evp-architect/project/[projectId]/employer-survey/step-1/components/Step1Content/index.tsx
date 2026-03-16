'use client';

import MultiSelectWithTextStep from '../../../components/MultiSelectWithTextStep';
import useStepNavigation from '../../../hooks/useStepNavigation';
import SelectedCompany from '../SelectedCompany';

import useAdminTokenValidation from '@/app/hooks/useAdminTokenValidation';

interface Step1ContentProps {
  readonly adminToken: string | null;
  readonly projectId: string;
}

export default function Step1Content({
  adminToken,
  projectId,
}: Step1ContentProps) {
  const {project} = useAdminTokenValidation(projectId, adminToken);
  const {navigateToProject} = useStepNavigation(projectId, 1, adminToken);

  return (
    <MultiSelectWithTextStep
      adminToken={adminToken}
      headerContent={
        <SelectedCompany
          companyName={project?.company_name || ''}
          industry={project?.industry_name}
          location={project?.location}
          logoUrl={project?.profile_image_url}
        />
      }
      onBackNavigation={navigateToProject}
      projectId={projectId}
      showBackButton={false}
      stepNumber={1}
      stepTitle="Who you are today (Culture & Values)?"
    />
  );
}
