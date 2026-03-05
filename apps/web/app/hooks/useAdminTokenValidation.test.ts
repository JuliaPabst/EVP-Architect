import {renderHook, waitFor} from '@testing-library/react';
import {useRouter} from 'next/navigation';

import useAdminTokenValidation from './useAdminTokenValidation';

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
      json: async () => ({isValid: false}),
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
        isValid: true,
        project: {
          company_name: 'Test Company',
        },
      }),
      ok: true,
    });

    const {result} = renderHook(() =>
      useAdminTokenValidation(mockProjectId, mockAdminToken),
    );

    // Initially validating
    expect(result.current.isValidating).toBe(true);
    expect(result.current.companyName).toBe('');

    // After validation
    await waitFor(() => {
      expect(result.current.isValidating).toBe(false);
    });

    expect(result.current.companyName).toBe('Test Company');
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
        isValid: true,
        project: {
          company_name: 'Test Company',
        },
      }),
      ok: true,
    });

    renderHook(() => useAdminTokenValidation(mockProjectId, mockAdminToken));

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/projects/validate-admin',
        {
          body: JSON.stringify({
            adminToken: mockAdminToken,
            projectId: mockProjectId,
          }),
          headers: {
            'Content-Type': 'application/json',
          },
          method: 'POST',
        },
      );
    });
  });
});
