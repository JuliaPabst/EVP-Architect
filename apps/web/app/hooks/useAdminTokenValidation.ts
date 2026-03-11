import {useEffect, useState} from 'react';

import {useRouter} from 'next/navigation';

interface ValidationResult {
  readonly companyName: string;
  readonly isValidating: boolean;
  readonly project?: {
    readonly company_name: string;
    readonly employee_count?: string;
    readonly industry_name?: string;
    readonly location?: string;
    readonly profile_image_url?: string;
  };
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
  const [project, setProject] = useState<ValidationResult['project']>(undefined);

  useEffect(() => {
    async function validateAccess() {
      if (!adminToken) {
        router.push('/evp-architect');
        return;
      }

      try {
        const response = await fetch(
          `/api/projects/validate-admin?projectId=${encodeURIComponent(projectId)}&admin_token=${encodeURIComponent(adminToken)}`,
        );

        const data = await response.json();

        if (!response.ok || !data.valid) {
          router.push('/evp-architect');
          return;
        }

        setProject({
          company_name: data.project.company_name,
          employee_count: data.project.employee_count,
          industry_name: data.project.industry_name,
          location: data.project.location,
          profile_image_url: data.project.profile_image_url,
        });
        setCompanyName(data.project.company_name);
        setIsValidating(false);
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error('Validation error:', error);
        router.push('/evp-architect, project');
      }
    }

    validateAccess();
  }, [adminToken, projectId, router]);

  return {companyName, isValidating, project};
}
