'use client';

import SelectedCompany from '@/app/components/survey/SelectedCompany';
import MultiSelectStep from '../../../components/MultiSelectStep';
import useStepNavigation from '../../../hooks/useStepNavigation';

import useProjectInfo from '@/app/hooks/useProjectInfo';

interface Step1ContentProps {
  readonly projectId: string;
}

export default function Step1Content({projectId}: Step1ContentProps) {
  const {navigateToPreviousStep} = useStepNavigation(projectId, 1);
  const {projectInfo} = useProjectInfo(projectId);

  return (
    <MultiSelectStep
      headerContent={
        <SelectedCompany
          companyName={projectInfo?.company_name || ''}
          location={projectInfo?.location ?? undefined}
          logoUrl={projectInfo?.profile_image_url ?? undefined}
        />
      }
      onBackNavigation={navigateToPreviousStep}
      projectId={projectId}
      showBackButton={false}
      stepNumber={1}
      stepTitle="Lived Values"
    />
  );
}
