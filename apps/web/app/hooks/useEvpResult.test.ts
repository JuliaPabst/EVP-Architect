import {act, renderHook, waitFor} from '@testing-library/react';

import useEvpResult from './useEvpResult';

global.fetch = jest.fn();

describe('useEvpResult', () => {
  const mockProjectId = 'project-123';
  const mockAdminToken = 'test-admin-token';

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('initial load — result already exists', () => {
    it('sets evpText and stops loading when an existing result is found', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        json: async () => ({results: [{result_text: 'Existing EVP content'}]}),
        ok: true,
      });

      const {result} = renderHook(() =>
        useEvpResult(mockProjectId, mockAdminToken),
      );

      expect(result.current.isLoading).toBe(true);
      expect(result.current.evpText).toBeNull();

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.evpText).toBe('Existing EVP content');
      expect(result.current.error).toBeNull();
      expect(global.fetch).toHaveBeenCalledTimes(1);
    });

    it('fetches results with correct URL and headers', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        json: async () => ({results: [{result_text: 'EVP text'}]}),
        ok: true,
      });

      renderHook(() => useEvpResult(mockProjectId, mockAdminToken, 'external'));

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          `/api/evp-pipeline/results?projectId=${mockProjectId}&pipeline_step=external`,
          {headers: {'x-admin-token': mockAdminToken}},
        );
      });
    });

    it('defaults to internal output type', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        json: async () => ({results: [{result_text: 'EVP text'}]}),
        ok: true,
      });

      renderHook(() => useEvpResult(mockProjectId, mockAdminToken));

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          expect.stringContaining('pipeline_step=internal'),
          expect.any(Object),
        );
      });
    });
  });

  describe('initial load — no existing result, triggers pipeline', () => {
    it('runs trigger and generate when no existing result is found', async () => {
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          // results endpoint — empty
          json: async () => ({results: []}),
          ok: true,
        })
        .mockResolvedValueOnce({
          // trigger endpoint
          json: async () => ({success: true}),
          ok: true,
        })
        .mockResolvedValueOnce({
          // generate endpoint
          json: async () => ({text: 'Newly generated EVP'}),
          ok: true,
        });

      const {result} = renderHook(() =>
        useEvpResult(mockProjectId, mockAdminToken),
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.evpText).toBe('Newly generated EVP');
      expect(global.fetch).toHaveBeenCalledTimes(3);
    });

    it('calls trigger with POST method', async () => {
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({json: async () => ({results: []}), ok: true})
        .mockResolvedValueOnce({json: async () => ({}), ok: true})
        .mockResolvedValueOnce({
          json: async () => ({text: 'EVP text'}),
          ok: true,
        });

      renderHook(() => useEvpResult(mockProjectId, mockAdminToken));

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          expect.stringContaining('/api/evp-pipeline/trigger'),
          expect.objectContaining({method: 'POST'}),
        );
      });
    });

    it('calls generate with correct outputType', async () => {
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({json: async () => ({results: []}), ok: true})
        .mockResolvedValueOnce({json: async () => ({}), ok: true})
        .mockResolvedValueOnce({
          json: async () => ({text: 'EVP text'}),
          ok: true,
        });

      renderHook(() =>
        useEvpResult(mockProjectId, mockAdminToken, 'gap_analysis'),
      );

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          expect.stringContaining('outputType=gap_analysis'),
          expect.any(Object),
        );
      });
    });

    it('sets evpText to null when generate returns no text', async () => {
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({json: async () => ({results: []}), ok: true})
        .mockResolvedValueOnce({json: async () => ({}), ok: true})
        .mockResolvedValueOnce({json: async () => ({}), ok: true}); // no text field

      const {result} = renderHook(() =>
        useEvpResult(mockProjectId, mockAdminToken),
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.evpText).toBeNull();
    });
  });

  describe('error handling on initial load', () => {
    it('sets error when results fetch fails', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        json: async () => ({message: 'Unauthorized'}),
        ok: false,
      });

      const {result} = renderHook(() =>
        useEvpResult(mockProjectId, mockAdminToken),
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.error).toBe('Unauthorized');
      expect(result.current.evpText).toBeNull();
    });

    it('sets error when trigger fails', async () => {
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({json: async () => ({results: []}), ok: true})
        .mockResolvedValueOnce({
          json: async () => ({message: 'Pipeline failed'}),
          ok: false,
        });

      const {result} = renderHook(() =>
        useEvpResult(mockProjectId, mockAdminToken),
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.error).toBe('Pipeline failed');
    });

    it('sets error when generate fails', async () => {
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({json: async () => ({results: []}), ok: true})
        .mockResolvedValueOnce({json: async () => ({}), ok: true})
        .mockResolvedValueOnce({
          json: async () => ({message: 'Generation failed'}),
          ok: false,
        });

      const {result} = renderHook(() =>
        useEvpResult(mockProjectId, mockAdminToken),
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.error).toBe('Generation failed');
    });

    it('sets default error message when response has no message', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        json: async () => ({}),
        ok: false,
      });

      const {result} = renderHook(() =>
        useEvpResult(mockProjectId, mockAdminToken),
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.error).toBe('Failed to fetch EVP results');
    });

    it('sets error when fetch throws', async () => {
      (global.fetch as jest.Mock).mockRejectedValueOnce(
        new Error('Network error'),
      );

      const {result} = renderHook(() =>
        useEvpResult(mockProjectId, mockAdminToken),
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.error).toBe('Network error');
    });
  });

  describe('regenerate', () => {
    it('calls regenerate API and updates evpText on success', async () => {
      // Initial load: result exists
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          json: async () => ({results: [{result_text: 'Initial EVP'}]}),
          ok: true,
        })
        // Regenerate call
        .mockResolvedValueOnce({
          json: async () => ({text: 'Regenerated EVP'}),
          ok: true,
        });

      const {result} = renderHook(() =>
        useEvpResult(mockProjectId, mockAdminToken),
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await act(async () => {
        await result.current.regenerate('Please improve the tone');
      });

      expect(result.current.evpText).toBe('Regenerated EVP');
      expect(result.current.isRegenerating).toBe(false);
      expect(result.current.error).toBeNull();
    });

    it('sends comment text in regenerate request body', async () => {
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          json: async () => ({results: [{result_text: 'EVP'}]}),
          ok: true,
        })
        .mockResolvedValueOnce({
          json: async () => ({text: 'Updated EVP'}),
          ok: true,
        });

      const {result} = renderHook(() =>
        useEvpResult(mockProjectId, mockAdminToken),
      );

      await waitFor(() => expect(result.current.isLoading).toBe(false));

      await act(async () => {
        await result.current.regenerate('Make it shorter');
      });

      expect(global.fetch).toHaveBeenLastCalledWith(
        expect.stringContaining('/api/evp-pipeline/regenerate'),
        expect.objectContaining({
          body: JSON.stringify({commentText: 'Make it shorter'}),
          method: 'POST',
        }),
      );
    });

    it('appends settings params to regenerate URL', async () => {
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          json: async () => ({results: [{result_text: 'EVP'}]}),
          ok: true,
        })
        .mockResolvedValueOnce({
          json: async () => ({text: 'Updated EVP'}),
          ok: true,
        });

      const {result} = renderHook(() =>
        useEvpResult(mockProjectId, mockAdminToken, 'external'),
      );

      await waitFor(() => expect(result.current.isLoading).toBe(false));

      await act(async () => {
        await result.current.regenerate('Adjust tone', {
          language: 'de',
          targetAudience: 'engineers',
          targetAudienceDetail: '',
          toneOfVoice: 'formal',
        });
      });

      const lastCall = (global.fetch as jest.Mock).mock.calls.at(
        -1,
      )?.[0] as string;

      expect(lastCall).toContain('targetAudience=engineers');
      expect(lastCall).toContain('toneOfVoice=formal');
      expect(lastCall).toContain('language=de');
      expect(lastCall).toContain('outputType=external');
    });

    it('sets error when regenerate request fails', async () => {
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          json: async () => ({results: [{result_text: 'EVP'}]}),
          ok: true,
        })
        .mockResolvedValueOnce({
          json: async () => ({message: 'Regeneration failed'}),
          ok: false,
        });

      const {result} = renderHook(() =>
        useEvpResult(mockProjectId, mockAdminToken),
      );

      await waitFor(() => expect(result.current.isLoading).toBe(false));

      await act(async () => {
        await result.current.regenerate('Change something');
      });

      expect(result.current.error).toBe('Regeneration failed');
      expect(result.current.isRegenerating).toBe(false);
    });

    it('sets error when regenerate throws', async () => {
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          json: async () => ({results: [{result_text: 'EVP'}]}),
          ok: true,
        })
        .mockRejectedValueOnce(new Error('Network failure'));

      const {result} = renderHook(() =>
        useEvpResult(mockProjectId, mockAdminToken),
      );

      await waitFor(() => expect(result.current.isLoading).toBe(false));

      await act(async () => {
        await result.current.regenerate('Change something');
      });

      expect(result.current.error).toBe('Network failure');
      expect(result.current.isRegenerating).toBe(false);
    });

    it('does not append undefined settings params to URL', async () => {
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          json: async () => ({results: [{result_text: 'EVP'}]}),
          ok: true,
        })
        .mockResolvedValueOnce({
          json: async () => ({text: 'Updated EVP'}),
          ok: true,
        });

      const {result} = renderHook(() =>
        useEvpResult(mockProjectId, mockAdminToken),
      );

      await waitFor(() => expect(result.current.isLoading).toBe(false));

      await act(async () => {
        await result.current.regenerate('Adjust', {
          language: '',
          targetAudience: '',
          targetAudienceDetail: '',
          toneOfVoice: '',
        });
      });

      const lastCall = (global.fetch as jest.Mock).mock.calls.at(
        -1,
      )?.[0] as string;

      expect(lastCall).not.toContain('targetAudience=');
      expect(lastCall).not.toContain('toneOfVoice=');
      expect(lastCall).not.toContain('language=');
    });
  });
});
