'use client';

import {useRouter} from 'next/navigation';

import MultiSelectWithTextStep from '../../../components/MultiSelectWithTextStep';

import useStepNavigation from '@/app/hooks/useEmployerStepNavigation';

interface Step4ContentProps {
  readonly adminToken: string | null;
  readonly projectId: string;
}

export default function Step4Content({
  adminToken,
  projectId,
}: Step4ContentProps) {
  const {navigateToPreviousStep} = useStepNavigation(projectId, 4, adminToken);
  const router = useRouter();

  const handleAfterSave = async () => {
    const hash = adminToken ? `#admin=${adminToken}` : '';

    router.push(`/evp-architect/project/${projectId}/evp-generation${hash}`);
  };

  return (
    <MultiSelectWithTextStep
      adminToken={adminToken}
      onAfterSave={handleAfterSave}
      onBackNavigation={navigateToPreviousStep}
      projectId={projectId}
      showBackButton
      stepNumber={4}
      stepTitle="Leitplanken (Ton & Realitätscheck)"
    />
  );
}
