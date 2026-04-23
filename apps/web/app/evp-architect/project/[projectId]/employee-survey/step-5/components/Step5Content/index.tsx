'use client';

import TextStep from '../../../components/TextStep';

interface Step5ContentProps {
  readonly projectId: string;
}

export default function Step5Content({projectId}: Step5ContentProps) {
  return (
    <TextStep
      projectId={projectId}
      stepNumber={5}
      stepTitle="Differenzierung"
    />
  );
}
