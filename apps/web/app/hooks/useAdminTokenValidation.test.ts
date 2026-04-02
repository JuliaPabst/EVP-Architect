import {renderHook, waitFor} from '@testing-library/react';
import {useRouter} from 'next/navigation';

import useAdminTokenValidation, {
  clearAdminValidationCacheForTests,
} from './useAdminTokenValidation';

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}));

// Mock fetch
global.fetch = jest.fn();

describe('useAdminTokenValidation', () => {
  const mockPush = jest.fn();
  const mockProjectId = '123e4567-e89b-12d3-a456-426614174000';
  const mockAdminToken = 'test-admin-token';

  beforeEach(() => {
    jest.clearAllMocks();
    clearAdminValidationCacheForTests();
    (useRouter as jest.Mock).mockReturnValue({
      push: mockPush,
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should redirect when adminToken is null', async () => {
    renderHook(() => useAdminTokenValidation(mockProjectId, null));

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/evp-architect');
    });
  });

  it('should redirect when validation fails', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      json: async () => ({valid: false}),
      ok: false,
    });

    renderHook(() => useAdminTokenValidation(mockProjectId, mockAdminToken));

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/evp-architect');
    });
  });

  it('should return companyName when validation succeeds', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      json: async () => ({
        project: {
          company_name: 'Test Company',
          employee_count: '100-500',
          industry_name: 'Technology',
          location: 'Berlin, Germany',
          profile_image_url: 'https://example.com/logo.png',
        },
        valid: true,
      }),
      ok: true,
    });

    const {result} = renderHook(() =>
      useAdminTokenValidation(mockProjectId, mockAdminToken),
    );

    // Initially validating
    expect(result.current.isValidating).toBe(true);
    expect(result.current.companyName).toBe('');
    expect(result.current.project).toBeUndefined();

    // After validation
    await waitFor(() => {
      expect(result.current.isValidating).toBe(false);
    });

    expect(result.current.companyName).toBe('Test Company');
    expect(result.current.project).toEqual({
      company_name: 'Test Company',
      employee_count: '100-500',
      industry_name: 'Technology',
      location: 'Berlin, Germany',
      profile_image_url: 'https://example.com/logo.png',
    });
    expect(mockPush).not.toHaveBeenCalled();
  });

  it('should redirect when fetch throws error', async () => {
    (global.fetch as jest.Mock).mockRejectedValueOnce(
      new Error('Network error'),
    );

    renderHook(() => useAdminTokenValidation(mockProjectId, mockAdminToken));

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/evp-architect');
    });
  });

  it('should call validation API with correct parameters', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      json: async () => ({
        project: {
          company_name: 'Test Company',
        },
        valid: true,
      }),
      ok: true,
    });

    renderHook(() => useAdminTokenValidation(mockProjectId, mockAdminToken));

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        `/api/projects/validate-admin?projectId=${mockProjectId}`,
        {headers: {'x-admin-token': mockAdminToken}},
      );
    });
  });

  it('should not redirect and stay in validating state when adminToken is undefined', async () => {
    const {result} = renderHook(() =>
      useAdminTokenValidation(mockProjectId, undefined),
    );

    // When token is undefined (not yet loaded), we stay in validating state
    // and do not call fetch or redirect
    expect(result.current.isValidating).toBe(true);
    expect(global.fetch).not.toHaveBeenCalled();
    expect(mockPush).not.toHaveBeenCalled();
  });

  it('should use cached validation on second call with same credentials', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      json: async () => ({
        project: {company_name: 'Test Company'},
        valid: true,
      }),
      ok: true,
    });

    // First hook renders and populates cache
    const {unmount} = renderHook(() =>
      useAdminTokenValidation(mockProjectId, mockAdminToken),
    );

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledTimes(1);
    });

    unmount();

    // Second hook should hit cache, not fetch again
    renderHook(() => useAdminTokenValidation(mockProjectId, mockAdminToken));

    await waitFor(() => {
      // Still only 1 fetch call total (cache was used)
      expect(global.fetch).toHaveBeenCalledTimes(1);
    });
  });
});
