'use client';

import {useState} from 'react';

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
  const [completeError, setCompleteError] = useState<string | null>(null);

  const handleAfterSave = async () => {
    if (!adminToken) return;

    const response = await fetch(
      `/api/employer-survey/complete?projectId=${projectId}`,
      {headers: {'x-admin-token': adminToken}, method: 'POST'},
    );

    if (!response.ok) {
      const errorData = await response.json();

      setCompleteError(errorData.message || 'Failed to complete survey');
      return;
    }

    router.push(`/evp-architect/project/${projectId}/evp-generation`);
  };

  return (
    <>
      {completeError && <p>{completeError}</p>}
      <MultiSelectWithTextStep
        adminToken={adminToken}
        onAfterSave={adminToken ? handleAfterSave : undefined}
        onBackNavigation={navigateToPreviousStep}
        projectId={projectId}
        showBackButton
        stepNumber={4}
        stepTitle="Leitplanken (Ton & Realitätscheck)"
      />
    </>
  );
}
