'use client';

import TextStep from '../../../components/TextStep';

interface Step4ContentProps {
  readonly projectId: string;
}

export default function Step4Content({projectId}: Step4ContentProps) {
  return (
    <TextStep
      projectId={projectId}
      stepNumber={4}
      stepTitle="Kulturelle Passung"
    />
  );
}
