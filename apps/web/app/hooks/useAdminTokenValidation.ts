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

const VALIDATION_CACHE_TTL_MS = 5 * 60 * 1000;

interface CachedValidation {
  readonly companyName: string;
  readonly project: ValidationResult['project'];
  readonly validatedAt: number;
}

const validationCache = new Map<string, CachedValidation>();
const inFlightValidationRequests = new Map<
  string,
  Promise<CachedValidation | null>
>();

function getValidationCacheKey(projectId: string, adminToken: string): string {
  return `${projectId}:${adminToken}`;
}

function getCachedValidation(cacheKey: string): CachedValidation | null {
  const cachedValidation = validationCache.get(cacheKey);

  if (!cachedValidation) {
    return null;
  }

  if (Date.now() - cachedValidation.validatedAt > VALIDATION_CACHE_TTL_MS) {
    validationCache.delete(cacheKey);
    return null;
  }

  return cachedValidation;
}

function setCachedValidation(
  cacheKey: string,
  cachedValidation: CachedValidation,
): void {
  validationCache.set(cacheKey, cachedValidation);
}

export function clearAdminValidationCacheForTests(): void {
  if (process.env.NODE_ENV === 'test') {
    validationCache.clear();
    inFlightValidationRequests.clear();
  }
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
  const [project, setProject] =
    useState<ValidationResult['project']>(undefined);

  useEffect(() => {
    let isDisposed = false;

    async function validateAccess() {
      if (!adminToken) {
        if (!isDisposed) {
          setIsValidating(false);
          router.push('/evp-architect');
        }

        return;
      }

      const cacheKey = getValidationCacheKey(projectId, adminToken);
      const cachedValidation = getCachedValidation(cacheKey);

      if (cachedValidation) {
        if (!isDisposed) {
          setProject(cachedValidation.project);
          setCompanyName(cachedValidation.companyName);
          setIsValidating(false);
        }

        return;
      }

      if (!isDisposed) {
        setIsValidating(true);
      }

      try {
        let inFlightRequest = inFlightValidationRequests.get(cacheKey);

        if (!inFlightRequest) {
          inFlightRequest = (async () => {
            const response = await fetch(
              `/api/projects/validate-admin?projectId=${encodeURIComponent(projectId)}&admin_token=${encodeURIComponent(adminToken)}`,
            );

            const data = await response.json();

            if (!response.ok || !data.valid) {
              return null;
            }

            return {
              companyName: data.project.company_name,
              project: {
                company_name: data.project.company_name,
                employee_count: data.project.employee_count,
                industry_name: data.project.industry_name,
                location: data.project.location,
                profile_image_url: data.project.profile_image_url,
              },
              validatedAt: Date.now(),
            };
          })();

          inFlightValidationRequests.set(cacheKey, inFlightRequest);
        }

        const validationResult = await inFlightRequest;

        if (!validationResult) {
          if (!isDisposed) {
            setIsValidating(false);
            router.push('/evp-architect');
          }

          return;
        }

        setCachedValidation(cacheKey, validationResult);

        if (!isDisposed) {
          setProject(validationResult.project);
          setCompanyName(validationResult.companyName);
          setIsValidating(false);
        }
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error('Validation error:', error);

        if (!isDisposed) {
          setIsValidating(false);
          router.push('/evp-architect');
        }
      } finally {
        inFlightValidationRequests.delete(cacheKey);
      }
    }

    validateAccess().catch(() => undefined);

    return () => {
      isDisposed = true;
    };
  }, [adminToken, projectId, router]);

  return {companyName, isValidating, project};
}
