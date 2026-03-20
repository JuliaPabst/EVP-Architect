'use client';

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

  return (
    <MultiSelectWithTextStep
      adminToken={adminToken}
      onBackNavigation={navigateToPreviousStep}
      projectId={projectId}
      showBackButton
      stepNumber={4}
      stepTitle="Guardrails (Tone & Reality Check)"
    />
  );
}
