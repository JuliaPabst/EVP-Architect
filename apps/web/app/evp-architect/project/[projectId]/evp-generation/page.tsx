'use client';

import EvpGenerationContent from './components/EvpGenerationContent';

import KununuHeader from '@/app/components/KununuHeader';
import useAdminToken from '@/app/hooks/useAdminToken';
import useAdminTokenValidation from '@/app/hooks/useAdminTokenValidation';

interface EvpGenerationPageProps {
  readonly params: {
    readonly projectId: string;
  };
}

export default function EvpGenerationPage({params}: EvpGenerationPageProps) {
  const {projectId} = params;
  const adminToken = useAdminToken(projectId);
  const {isValidating} = useAdminTokenValidation(projectId, adminToken);

  if (!adminToken || isValidating) {
    return null;
  }

  return (
    <>
      <KununuHeader />
      <EvpGenerationContent adminToken={adminToken} projectId={projectId} />
    </>
  );
}
