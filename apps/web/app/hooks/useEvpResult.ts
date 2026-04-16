import {useCallback, useState} from 'react';

import {EvpGenerationSettings} from './useEvpSettings';

import {EvpOutputType} from '@/lib/types/pipeline';

interface EvpResultState {
  readonly error: string | null;
  readonly evpText: string | null;
  readonly isLoading: boolean;
  readonly isRegenerating: boolean;
}

interface UseEvpResultReturn extends EvpResultState {
  readonly regenerate: (
    commentText: string,
    settings?: EvpGenerationSettings,
  ) => Promise<void>;
}

/**
 * Custom hook for on-demand EVP generation.
 *
 * Purpose:
 *   Manages the EVP generation workflow triggered by explicit user action.
 *   No auto-generation on mount — generation only starts when regenerate() is called.
 *
 * Flow on each call to regenerate():
 *   1. POST /api/evp-pipeline/trigger  — assembles + analyzes if needed, or skips
 *   2. POST /api/evp-pipeline/regenerate?scope=output — generates EVP text
 *
 * @param projectId - UUID of the project
 * @param adminToken - Admin token for authentication
 * @param outputType - EVP output type (internal | external | gap_analysis)
 * @returns Object with evpText, loading state, error, and regenerate function
 */
export default function useEvpResult(
  projectId: string,
  adminToken: string,
  outputType: EvpOutputType = 'internal',
): UseEvpResultReturn {
  const [evpText, setEvpText] = useState<string | null>(null);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const regenerate = useCallback(
    async (commentText: string, settings?: EvpGenerationSettings) => {
      try {
        setIsRegenerating(true);
        setError(null);

        // Step 0 & 1: Run assemble + analyze, or skip if already up-to-date
        const triggerResponse = await fetch(
          `/api/evp-pipeline/trigger?projectId=${encodeURIComponent(projectId)}`,
          {headers: {'x-admin-token': adminToken}, method: 'POST'},
        );

        if (!triggerResponse.ok) {
          const errorData = await triggerResponse.json();

          throw new Error(errorData.message || 'Failed to run EVP pipeline');
        }

        // Step 2: Generate EVP output with current settings
        const queryParams = new URLSearchParams({
          outputType,
          projectId,
          scope: 'output',
        });

        if (settings?.targetAudience) {
          queryParams.append('targetAudience', settings.targetAudience);
        }
        if (settings?.toneOfVoice) {
          queryParams.append('toneOfVoice', settings.toneOfVoice);
        }
        if (settings?.language) {
          queryParams.append('language', settings.language);
        }

        const generateResponse = await fetch(
          `/api/evp-pipeline/regenerate?${queryParams.toString()}`,
          {
            body: JSON.stringify({commentText}),
            headers: {
              'Content-Type': 'application/json',
              'x-admin-token': adminToken,
            },
            method: 'POST',
          },
        );

        if (!generateResponse.ok) {
          const errorData = await generateResponse.json();

          throw new Error(errorData.message || 'Failed to generate EVP');
        }

        const data = await generateResponse.json();

        setEvpText(data.text || null);
        setIsRegenerating(false);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error occurred');
        setIsRegenerating(false);

        // eslint-disable-next-line no-console
        console.error('Error generating EVP:', err);
      }
    },
    [adminToken, outputType, projectId],
  );

  return {
    error,
    evpText,
    isLoading: false,
    isRegenerating,
    regenerate,
  };
}
