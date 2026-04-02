'use client';

import useAdminToken from '@/app/hooks/useAdminToken';
import useAdminTokenValidation from '@/app/hooks/useAdminTokenValidation';
import KununuHeader from '@/app/components/KununuHeader';

import EvpResultContent from './components/EvpResultContent';

interface EvpResultPageProps {
  readonly params: {
    readonly projectId: string;
  };
}

export default function EvpResultPage({params}: EvpResultPageProps) {
  const {projectId} = params;
  const adminToken = useAdminToken(projectId);
  const {isValidating} = useAdminTokenValidation(projectId, adminToken);

  if (isValidating) {
    return null;
  }

  return (
    <div data-testid="evp-result-page">
      <KununuHeader />
      <EvpResultContent adminToken={adminToken ?? ''} projectId={projectId} />
    </div>
  );
}
