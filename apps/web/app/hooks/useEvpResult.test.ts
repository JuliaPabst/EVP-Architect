import {act, renderHook} from '@testing-library/react';

import useEvpResult from './useEvpResult';

global.fetch = jest.fn();

describe('useEvpResult', () => {
  const mockProjectId = 'project-123';
  const mockAdminToken = 'test-admin-token';

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('initial state', () => {
    it('returns null evpText, false isLoading, false isRegenerating, null error', () => {
      const {result} = renderHook(() =>
        useEvpResult(mockProjectId, mockAdminToken),
      );

      expect(result.current.evpText).toBeNull();
      expect(result.current.isLoading).toBe(false);
      expect(result.current.isRegenerating).toBe(false);
      expect(result.current.error).toBeNull();
    });

    it('does not fetch anything on mount', () => {
      renderHook(() => useEvpResult(mockProjectId, mockAdminToken));

      expect(global.fetch).not.toHaveBeenCalled();
    });

    it('exposes a regenerate function', () => {
      const {result} = renderHook(() =>
        useEvpResult(mockProjectId, mockAdminToken),
      );

      expect(typeof result.current.regenerate).toBe('function');
    });
  });

  describe('regenerate — success flow', () => {
    it('calls trigger then regenerate and sets evpText on success', async () => {
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          json: async () => ({ran: true}),
          ok: true,
        })
        .mockResolvedValueOnce({
          json: async () => ({text: 'Generated EVP text'}),
          ok: true,
        });

      const {result} = renderHook(() =>
        useEvpResult(mockProjectId, mockAdminToken),
      );

      await act(async () => {
        await result.current.regenerate('Improve the tone');
      });

      expect(result.current.evpText).toBe('Generated EVP text');
      expect(result.current.isRegenerating).toBe(false);
      expect(result.current.error).toBeNull();
      expect(global.fetch).toHaveBeenCalledTimes(2);
    });

    it('calls trigger with POST method and admin token header', async () => {
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({json: async () => ({ran: true}), ok: true})
        .mockResolvedValueOnce({
          json: async () => ({text: 'EVP'}),
          ok: true,
        });

      const {result} = renderHook(() =>
        useEvpResult(mockProjectId, mockAdminToken),
      );

      await act(async () => {
        await result.current.regenerate('');
      });

      expect(global.fetch).toHaveBeenNthCalledWith(
        1,
        expect.stringContaining(
          `/api/evp-pipeline/trigger?projectId=${mockProjectId}`,
        ),
        expect.objectContaining({
          headers: {'x-admin-token': mockAdminToken},
          method: 'POST',
        }),
      );
    });

    it('sends comment text in regenerate request body', async () => {
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({json: async () => ({ran: true}), ok: true})
        .mockResolvedValueOnce({
          json: async () => ({text: 'Updated EVP'}),
          ok: true,
        });

      const {result} = renderHook(() =>
        useEvpResult(mockProjectId, mockAdminToken),
      );

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

    it('includes outputType, projectId and scope in regenerate URL', async () => {
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({json: async () => ({ran: true}), ok: true})
        .mockResolvedValueOnce({
          json: async () => ({text: 'EVP'}),
          ok: true,
        });

      const {result} = renderHook(() =>
        useEvpResult(mockProjectId, mockAdminToken, 'external'),
      );

      await act(async () => {
        await result.current.regenerate('');
      });

      const url = (global.fetch as jest.Mock).mock.calls[1]?.[0] as string;

      expect(url).toContain('outputType=external');
      expect(url).toContain(`projectId=${mockProjectId}`);
      expect(url).toContain('scope=output');
    });

    it('defaults to internal outputType in regenerate URL', async () => {
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({json: async () => ({ran: true}), ok: true})
        .mockResolvedValueOnce({
          json: async () => ({text: 'EVP'}),
          ok: true,
        });

      const {result} = renderHook(() =>
        useEvpResult(mockProjectId, mockAdminToken),
      );

      await act(async () => {
        await result.current.regenerate('');
      });

      const url = (global.fetch as jest.Mock).mock.calls[1]?.[0] as string;

      expect(url).toContain('outputType=internal');
    });

    it('appends settings params to regenerate URL when set', async () => {
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({json: async () => ({ran: true}), ok: true})
        .mockResolvedValueOnce({
          json: async () => ({text: 'EVP'}),
          ok: true,
        });

      const {result} = renderHook(() =>
        useEvpResult(mockProjectId, mockAdminToken, 'external'),
      );

      await act(async () => {
        await result.current.regenerate('Adjust tone', {
          language: 'de',
          targetAudience: 'engineers',
          targetAudienceDetail: '',
          toneOfVoice: 'formal',
        });
      });

      const url = (global.fetch as jest.Mock).mock.calls[1]?.[0] as string;

      expect(url).toContain('targetAudience=engineers');
      expect(url).toContain('toneOfVoice=formal');
      expect(url).toContain('language=de');
    });

    it('does not append empty settings params to regenerate URL', async () => {
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({json: async () => ({ran: true}), ok: true})
        .mockResolvedValueOnce({
          json: async () => ({text: 'EVP'}),
          ok: true,
        });

      const {result} = renderHook(() =>
        useEvpResult(mockProjectId, mockAdminToken),
      );

      await act(async () => {
        await result.current.regenerate('Adjust', {
          language: '',
          targetAudience: '',
          targetAudienceDetail: '',
          toneOfVoice: '',
        });
      });

      const url = (global.fetch as jest.Mock).mock.calls[1]?.[0] as string;

      expect(url).not.toContain('targetAudience=');
      expect(url).not.toContain('toneOfVoice=');
      expect(url).not.toContain('language=');
    });

    it('sets evpText to null when regenerate returns no text field', async () => {
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({json: async () => ({ran: true}), ok: true})
        .mockResolvedValueOnce({
          json: async () => ({}),
          ok: true,
        });

      const {result} = renderHook(() =>
        useEvpResult(mockProjectId, mockAdminToken),
      );

      await act(async () => {
        await result.current.regenerate('');
      });

      expect(result.current.evpText).toBeNull();
    });
  });

  describe('regenerate — error handling', () => {
    it('sets error and clears isRegenerating when trigger request fails', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        json: async () => ({message: 'Pipeline failed'}),
        ok: false,
      });

      const {result} = renderHook(() =>
        useEvpResult(mockProjectId, mockAdminToken),
      );

      await act(async () => {
        await result.current.regenerate('');
      });

      expect(result.current.error).toBe('Pipeline failed');
      expect(result.current.isRegenerating).toBe(false);
    });

    it('uses fallback message when regenerate response has no message', async () => {
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({json: async () => ({ran: true}), ok: true})
        .mockResolvedValueOnce({
          json: async () => ({}),
          ok: false,
        });

      const {result} = renderHook(() =>
        useEvpResult(mockProjectId, mockAdminToken),
      );

      await act(async () => {
        await result.current.regenerate('');
      });

      expect(result.current.error).toBe('Failed to generate EVP');
    });

    it('uses fallback message when trigger response has no message', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        json: async () => ({}),
        ok: false,
      });

      const {result} = renderHook(() =>
        useEvpResult(mockProjectId, mockAdminToken),
      );

      await act(async () => {
        await result.current.regenerate('');
      });

      expect(result.current.error).toBe('Failed to run EVP pipeline');
    });

    it('sets error and clears isRegenerating when regenerate request fails', async () => {
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({json: async () => ({ran: true}), ok: true})
        .mockResolvedValueOnce({
          json: async () => ({message: 'Regeneration failed'}),
          ok: false,
        });

      const {result} = renderHook(() =>
        useEvpResult(mockProjectId, mockAdminToken),
      );

      await act(async () => {
        await result.current.regenerate('');
      });

      expect(result.current.error).toBe('Regeneration failed');
      expect(result.current.isRegenerating).toBe(false);
    });

    it('sets error when fetch throws', async () => {
      (global.fetch as jest.Mock).mockRejectedValueOnce(
        new Error('Network failure'),
      );

      const {result} = renderHook(() =>
        useEvpResult(mockProjectId, mockAdminToken),
      );

      await act(async () => {
        await result.current.regenerate('');
      });

      expect(result.current.error).toBe('Network failure');
      expect(result.current.isRegenerating).toBe(false);
    });

    it('sets error to "Unknown error occurred" when fetch throws a non-Error value', async () => {
      (global.fetch as jest.Mock).mockRejectedValueOnce('plain string error');

      const {result} = renderHook(() =>
        useEvpResult(mockProjectId, mockAdminToken),
      );

      await act(async () => {
        await result.current.regenerate('');
      });

      expect(result.current.error).toBe('Unknown error occurred');
      expect(result.current.isRegenerating).toBe(false);
    });

    it('sets isRegenerating to true during regenerate and false after', async () => {
      let resolveRegen!: (v: unknown) => void;
      const regenPromise = new Promise(res => {
        resolveRegen = res;
      });

      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({json: async () => ({ran: true}), ok: true})
        .mockReturnValueOnce({
          json: () => regenPromise.then(() => ({text: 'Done'})),
          ok: true,
        });

      const {result} = renderHook(() =>
        useEvpResult(mockProjectId, mockAdminToken),
      );

      const regeneratePromise = act(async () => {
        result.current.regenerate('');
      });

      resolveRegen(undefined);
      await regeneratePromise;

      expect(result.current.isRegenerating).toBe(false);
    });
  });
});
