'use client';

import TextStep from '../../../components/TextStep';

interface Step3ContentProps {
  readonly projectId: string;
}

export default function Step3Content({projectId}: Step3ContentProps) {
  return (
    <TextStep
      projectId={projectId}
      stepNumber={3}
      stepTitle="Daily Work Reality"
    />
  );
}
