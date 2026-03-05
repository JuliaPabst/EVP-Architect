// Test helper for employer survey step pages
/* eslint-disable import/no-extraneous-dependencies */
import {act, render, screen, waitFor} from '@testing-library/react';
import {useSearchParams} from 'next/navigation';

interface TestParams {
  readonly projectId: string;
}

export function setupMocks() {
  jest.clearAllMocks();
  jest.useFakeTimers();
  (useSearchParams as jest.Mock).mockReturnValue({
    get: jest.fn((param: string) => {
      if (param === 'admin') return 'test-admin-token';
      return null;
    }),
  });
}

export function cleanupMocks() {
  jest.runOnlyPendingTimers();
  jest.useRealTimers();
}

export async function renderAndWait(component: React.ReactElement) {
  render(component);
  await act(async () => {
    jest.runAllTimers();
  });
}

export const mockParams: TestParams = {
  projectId: 'test-project-123',
};

export function mockValidation(
  companyName = 'Test Company',
  isValidating = false,
) {
  const useAdminTokenValidation = jest.requireMock(
    '@/app/hooks/useAdminTokenValidation',
  );

  useAdminTokenValidation.mockReturnValue({
    companyName,
    isValidating,
  });
}

export async function expectToBeRendered(testId: string) {
  await waitFor(() => {
    expect(screen.getByTestId(testId)).toBeInTheDocument();
  });
}

export async function expectTextToBeRendered(text: string) {
  await waitFor(() => {
    expect(screen.getByText(text)).toBeInTheDocument();
  });
}
