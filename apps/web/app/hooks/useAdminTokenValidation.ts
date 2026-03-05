import {useEffect, useState} from 'react';

import {useRouter} from 'next/navigation';

interface ValidationResult {
  readonly companyName: string;
  readonly isValidating: boolean;
}

/**
 * Custom hook to validate admin token for employer-facing routes.
 *
 * Purpose:
 *   Secures employer survey routes by validating projectId and adminToken.
 *   Redirects to /evp-architect if validation fails.
 *
 * @param projectId - UUID of the project
 * @param adminToken - Admin token from query parameters
 * @returns Object with isValidating flag and companyName
 */
export default function useAdminTokenValidation(
  projectId: string,
  adminToken: string | null,
): ValidationResult {
  const router = useRouter();
  const [isValidating, setIsValidating] = useState(true);
  const [companyName, setCompanyName] = useState<string>('');

  useEffect(() => {
    async function validateAccess() {
      if (!adminToken) {
        router.push('/evp-architect');
        return;
      }

      try {
        const response = await fetch('/api/projects/validate-admin', {
          body: JSON.stringify({adminToken, projectId}),
          headers: {
            'Content-Type': 'application/json',
          },
          method: 'POST',
        });

        const data = await response.json();

        if (!response.ok || !data.isValid) {
          router.push('/evp-architect');
          return;
        }

        setCompanyName(data.project.company_name);
        setIsValidating(false);
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error('Validation error:', error);
        router.push('/evp-architect');
      }
    }

    validateAccess();
  }, [adminToken, projectId, router]);

  return {companyName, isValidating};
}
