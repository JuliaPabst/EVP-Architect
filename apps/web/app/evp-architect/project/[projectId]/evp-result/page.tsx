'use client';

import {useSearchParams} from 'next/navigation';

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
  const searchParams = useSearchParams();
  const adminToken = searchParams.get('admin_token') ?? '';
  const {isValidating} = useAdminTokenValidation(projectId, adminToken);

  if (isValidating) {
    return null;
  }

  return (
    <div data-testid="evp-result-page">
      <KununuHeader />
      <EvpResultContent adminToken={adminToken} projectId={projectId} />
    </div>
  );
}
