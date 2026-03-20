import '@testing-library/jest-dom';
import {act, renderHook, waitFor} from '@testing-library/react';

import useProjectInfo from './useProjectInfo';

const MOCK_PROJECT_INFO = {
  company_name: 'Acme GmbH',
  location: 'Berlin',
  profile_image_url: 'https://example.com/logo.png',
};

describe('useProjectInfo', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Clear the module-level cache between tests by resetting fetch mock
    global.fetch = jest.fn();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('starts with isLoading true and projectInfo null', () => {
    (global.fetch as jest.Mock).mockReturnValue(new Promise(() => {}));

    const {result} = renderHook(() => useProjectInfo('proj-1'));

    expect(result.current.isLoading).toBe(true);
    expect(result.current.projectInfo).toBeNull();
  });

  it('fetches project info from correct URL', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      json: jest.fn().mockResolvedValue(MOCK_PROJECT_INFO),
      ok: true,
    });

    renderHook(() => useProjectInfo('proj-abc'));

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/employee-survey/project-info?projectId=proj-abc',
      );
    });
  });

  it('sets projectInfo and sets isLoading to false on successful fetch', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      json: jest.fn().mockResolvedValue(MOCK_PROJECT_INFO),
      ok: true,
    });

    const {result} = renderHook(() => useProjectInfo('proj-success'));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.projectInfo).toEqual(MOCK_PROJECT_INFO);
  });

  it('sets isLoading to false and keeps projectInfo null when response is not ok', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: false,
    });

    const {result} = renderHook(() => useProjectInfo('proj-not-ok'));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.projectInfo).toBeNull();
  });

  it('sets isLoading to false and keeps projectInfo null on network error', async () => {
    (global.fetch as jest.Mock).mockRejectedValue(new Error('Network failure'));

    const {result} = renderHook(() => useProjectInfo('proj-error'));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.projectInfo).toBeNull();
  });

  it('does not update state when component unmounts before fetch completes', async () => {
    let resolvePromise!: (value: unknown) => void;
    const pendingPromise = new Promise(resolve => {
      resolvePromise = resolve;
    });

    (global.fetch as jest.Mock).mockReturnValue(pendingPromise);

    const {result, unmount} = renderHook(() => useProjectInfo('proj-unmount'));

    unmount();

    await act(async () => {
      resolvePromise({
        json: jest.fn().mockResolvedValue(MOCK_PROJECT_INFO),
        ok: true,
      });
    });

    // State should remain at initial values (not updated after unmount)
    expect(result.current.isLoading).toBe(true);
    expect(result.current.projectInfo).toBeNull();
  });
});
