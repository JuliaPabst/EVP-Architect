'use client';

import TextStep from '../../../components/TextStep';

interface Step2ContentProps {
  readonly projectId: string;
}

export default function Step2Content({projectId}: Step2ContentProps) {
  return (
    <TextStep
      projectId={projectId}
      stepNumber={2}
      stepTitle="Belonging Moment"
    />
  );
}
