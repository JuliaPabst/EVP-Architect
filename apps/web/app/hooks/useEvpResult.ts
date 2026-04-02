import {useCallback, useEffect, useState} from 'react';

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
 * Custom hook to fetch, generate, and regenerate EVP results.
 *
 * Purpose:
 *   Manages the EVP generation workflow:
 *   1. Fetches existing EVP output if available
 *   2. Auto-generates if no output exists
 *   3. Provides a regenerate function for adjustments
 *
 * @param projectId - UUID of the project
 * @param adminToken - Admin token for authentication
 * @returns Object with evpText, loading/regenerating states, error, and regenerate function
 */
export default function useEvpResult(
  projectId: string,
  adminToken: string,
  outputType: EvpOutputType = 'internal',
): UseEvpResultReturn {
  const [evpText, setEvpText] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isDisposed = false;

    async function loadEvpResult() {
      try {
        setIsLoading(true);
        setError(null);

        // Fetch existing EVP result
        const resultsResponse = await fetch(
          `/api/evp-pipeline/results?projectId=${encodeURIComponent(projectId)}&pipeline_step=${encodeURIComponent(outputType)}`,
          {headers: {'x-admin-token': adminToken}},
        );

        if (!resultsResponse.ok) {
          const errorData = await resultsResponse.json();

          throw new Error(errorData.message || 'Failed to fetch EVP results');
        }

        const resultsData = await resultsResponse.json();
        const existingResult = resultsData.results?.[0];

        // If result exists, use it
        if (existingResult?.result_text) {
          if (!isDisposed) {
            setEvpText(existingResult.result_text);
            setIsLoading(false);
          }
          return;
        }

        // Run full pipeline: assemble + analyze (Step 0 & 1)
        const triggerResponse = await fetch(
          `/api/evp-pipeline/trigger?projectId=${encodeURIComponent(projectId)}`,
          {headers: {'x-admin-token': adminToken}, method: 'POST'},
        );

        if (!triggerResponse.ok) {
          const errorData = await triggerResponse.json();

          throw new Error(errorData.message || 'Failed to run EVP pipeline');
        }

        // Generate EVP output (Step 2)
        const generateResponse = await fetch(
          `/api/evp-pipeline/generate?projectId=${encodeURIComponent(projectId)}&outputType=${encodeURIComponent(outputType)}`,
          {headers: {'x-admin-token': adminToken}, method: 'POST'},
        );

        if (!generateResponse.ok) {
          const errorData = await generateResponse.json();

          throw new Error(errorData.message || 'Failed to generate EVP');
        }

        const generateData = await generateResponse.json();

        if (!isDisposed) {
          setEvpText(generateData.text || null);
          setIsLoading(false);
        }
      } catch (err) {
        if (!isDisposed) {
          setError(
            err instanceof Error ? err.message : 'Unknown error occurred',
          );
          setIsLoading(false);
        }

        // eslint-disable-next-line no-console
        console.error('Error loading EVP result:', err);
      }
    }

    loadEvpResult().catch(() => undefined);

    return () => {
      isDisposed = true;
    };
  }, [adminToken, outputType, projectId]);

  const regenerate = useCallback(
    async (commentText: string, settings?: EvpGenerationSettings) => {
      try {
        setIsRegenerating(true);
        setError(null);

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

        const response = await fetch(
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

        if (!response.ok) {
          const errorData = await response.json();

          throw new Error(errorData.message || 'Failed to regenerate EVP');
        }

        const data = await response.json();

        setEvpText(data.text || null);
        setIsRegenerating(false);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error occurred');
        setIsRegenerating(false);

        // eslint-disable-next-line no-console
        console.error('Error regenerating EVP:', err);
      }
    },
    [adminToken, outputType, projectId],
  );

  return {
    error,
    evpText,
    isLoading,
    isRegenerating,
    regenerate,
  };
}
