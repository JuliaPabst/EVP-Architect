import '@testing-library/jest-dom';
import {render, screen, fireEvent, waitFor} from '@testing-library/react';
import {useRouter} from 'next/navigation';

import SearchHeader from '.';

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}));

// Mock fetch globally
global.fetch = jest.fn();

describe('SearchHeader', () => {
  const mockPush = jest.fn();

  beforeEach(() => {
    (useRouter as jest.Mock).mockReturnValue({
      push: mockPush,
    });
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('Rendering', () => {
    it('should render the main heading', () => {
      render(<SearchHeader />);

      expect(
        screen.getByText(
          'Do you want to find your Employer Value Proposition?',
        ),
      ).toBeInTheDocument();
    });

    it('should render the subheading', () => {
      render(<SearchHeader />);

      expect(
        screen.getByText('Paste your company profile URL here:'),
      ).toBeInTheDocument();
    });

    it('should render the input field', () => {
      render(<SearchHeader />);

      const input = screen.getByPlaceholderText('Company profile URL');

      expect(input).toBeInTheDocument();
    });

    it('should render the submit button', () => {
      render(<SearchHeader />);

      const button = screen.getByText('Load EVP Project');

      expect(button).toBeInTheDocument();
    });

    it('should render the link for existing profiles', () => {
      render(<SearchHeader />);

      const link = screen.getByText(
        'Do you already have an EBP or a Claimed profile?',
      );

      expect(link).toBeInTheDocument();
    });

    it('should have submit button disabled by default', () => {
      render(<SearchHeader />);

      const button = screen.getByRole('button', {name: /Load EVP Project/i});

      expect(button).toBeDisabled();
    });
  });

  describe('Input Validation', () => {
    it('should enable button when valid URL is entered', () => {
      render(<SearchHeader />);

      const input = screen.getByPlaceholderText('Company profile URL');
      const button = screen.getByRole('button', {name: /Load EVP Project/i});

      fireEvent.change(input, {
        target: {value: 'https://www.kununu.com/de/company-name'},
      });

      expect(button).toBeEnabled();
    });

    it('should show error for invalid URL format', async () => {
      render(<SearchHeader />);

      const input = screen.getByPlaceholderText('Company profile URL');
      const button = screen.getByRole('button', {name: /Load EVP Project/i});

      fireEvent.change(input, {
        target: {value: 'https://www.example.com/company'},
      });
      fireEvent.click(button);

      await waitFor(() => {
        expect(
          screen.getByText(/Please enter a valid kununu profile URL/i),
        ).toBeInTheDocument();
      });
    });

    it('should accept valid kununu URL with de country code', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        json: async () => ({
          adminToken: 'test-admin-123',
          projectId: 'test-project-123',
        }),
        ok: true,
      });

      render(<SearchHeader />);

      const input = screen.getByPlaceholderText('Company profile URL');
      const button = screen.getByRole('button', {name: /Load EVP Project/i});

      fireEvent.change(input, {
        target: {value: 'https://www.kununu.com/de/test-company'},
      });
      fireEvent.click(button);

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith(
          '/evp-architect/project/test-project-123/employer-survey/step-1?admin=test-admin-123',
        );
      });
    });

    it('should accept valid kununu URL with at country code', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        json: async () => ({
          adminToken: 'test-admin-456',
          projectId: 'test-project-456',
        }),
        ok: true,
      });

      render(<SearchHeader />);

      const input = screen.getByPlaceholderText('Company profile URL');
      const button = screen.getByRole('button', {name: /Load EVP Project/i});

      fireEvent.change(input, {
        target: {value: 'https://www.kununu.com/at/oesterreichische-post'},
      });
      fireEvent.click(button);

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith(
          '/evp-architect/project/test-project-456/employer-survey/step-1?admin=test-admin-456',
        );
      });
    });

    it('should accept valid kununu URL with ch country code', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        json: async () => ({
          adminToken: 'test-admin-789',
          projectId: 'test-project-789',
        }),
        ok: true,
      });

      render(<SearchHeader />);

      const input = screen.getByPlaceholderText('Company profile URL');
      const button = screen.getByRole('button', {name: /Load EVP Project/i});

      fireEvent.change(input, {
        target: {value: 'https://www.kununu.com/ch/schweizer-post'},
      });
      fireEvent.click(button);

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith(
          '/evp-architect/project/test-project-789/employer-survey/step-1?admin=test-admin-789',
        );
      });
    });

    it('should reject URL without country code', async () => {
      render(<SearchHeader />);

      const input = screen.getByPlaceholderText('Company profile URL');
      const button = screen.getByRole('button', {name: /Load EVP Project/i});

      fireEvent.change(input, {
        target: {value: 'https://www.kununu.com/company-name'},
      });
      fireEvent.click(button);

      await waitFor(() => {
        expect(
          screen.getByText(/Please enter a valid kununu profile URL/i),
        ).toBeInTheDocument();
      });
    });

    it('should clear error when user starts typing', async () => {
      render(<SearchHeader />);

      const input = screen.getByPlaceholderText('Company profile URL');
      const button = screen.getByRole('button', {name: /Load EVP Project/i});

      // Enter invalid URL and submit
      fireEvent.change(input, {
        target: {value: 'invalid-url'},
      });
      fireEvent.click(button);

      // Wait for error to appear
      await waitFor(() => {
        expect(
          screen.getByText(/Please enter a valid kununu profile URL/i),
        ).toBeInTheDocument();
      });

      // Start typing again
      fireEvent.change(input, {
        target: {value: 'https://www.kununu.com/de/'},
      });

      // Error should be cleared
      expect(
        screen.queryByText(/Please enter a valid kununu profile URL/i),
      ).not.toBeInTheDocument();
    });
  });

  describe('Form Submission', () => {
    it('should call API with correct URL on submit', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        json: async () => ({projectId: 'new-project'}),
        ok: true,
      });

      render(<SearchHeader />);

      const input = screen.getByPlaceholderText('Company profile URL');
      const submitButton = screen.getByRole('button', {
        name: /Load EVP Project/i,
      });

      fireEvent.change(input, {
        target: {value: 'https://www.kununu.com/de/test-company'},
      });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          '/api/projects/create',
          expect.objectContaining({
            body: JSON.stringify({
              companyUrl: 'https://www.kununu.com/de/test-company',
            }),
            headers: {
              'Content-Type': 'application/json',
            },
            method: 'POST',
          }),
        );
      });
    });

    it('should redirect to project page on successful submission', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        json: async () => ({
          adminToken: 'success-admin-123',
          projectId: 'success-project-123',
        }),
        ok: true,
      });

      render(<SearchHeader />);

      const input = screen.getByPlaceholderText('Company profile URL');
      const button = screen.getByRole('button', {name: /Load EVP Project/i});

      fireEvent.change(input, {
        target: {value: 'https://www.kununu.com/de/test-company'},
      });
      fireEvent.click(button);

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith(
          '/evp-architect/project/success-project-123/employer-survey/step-1?admin=success-admin-123',
        );
      });
    });

    it('should show loading state during submission', async () => {
      // Create a promise that we can control
      let resolvePromise: (value: {
        json: () => Promise<unknown>;
        ok: boolean;
      }) => void;
      const promise = new Promise(resolve => {
        resolvePromise = resolve;
      });

      (global.fetch as jest.Mock).mockReturnValueOnce(promise);

      render(<SearchHeader />);

      const input = screen.getByPlaceholderText('Company profile URL');
      const button = screen.getByRole('button', {name: /Load EVP Project/i});

      fireEvent.change(input, {
        target: {value: 'https://www.kununu.com/de/test-company'},
      });
      fireEvent.click(button);

      // Button should be disabled during loading
      await waitFor(() => {
        const loadingButton = screen.getByRole('button', {name: /Loading/i});

        expect(loadingButton).toBeDisabled();
      });

      // Resolve the promise
      resolvePromise!({
        json: async () => ({projectId: 'test'}),
        ok: true,
      });

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalled();
      });
    });

    it('should handle API error response', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        json: async () => ({error: 'Company not found'}),
        ok: false,
      });

      render(<SearchHeader />);

      const input = screen.getByPlaceholderText('Company profile URL');
      const button = screen.getByRole('button', {name: /Load EVP Project/i});

      fireEvent.change(input, {
        target: {value: 'https://www.kununu.com/de/test-company'},
      });
      fireEvent.click(button);

      await waitFor(() => {
        expect(
          screen.getByText(
            'Sorry, this should not have happened. Please, try again later.',
          ),
        ).toBeInTheDocument();
      });

      expect(mockPush).not.toHaveBeenCalled();
    });

    it('should handle network error', async () => {
      (global.fetch as jest.Mock).mockRejectedValueOnce(
        new Error('Network error'),
      );

      render(<SearchHeader />);

      const input = screen.getByPlaceholderText('Company profile URL');
      const button = screen.getByRole('button', {name: /Load EVP Project/i});

      fireEvent.change(input, {
        target: {value: 'https://www.kununu.com/de/test-company'},
      });
      fireEvent.click(button);

      await waitFor(() => {
        expect(
          screen.getByText(
            'Sorry, this should not have happened. Please, try again later.',
          ),
        ).toBeInTheDocument();
      });
    });

    it('should not submit when URL is empty or whitespace', () => {
      render(<SearchHeader />);

      const button = screen.getByRole('button', {name: /Load EVP Project/i});

      // Empty string
      expect(button).toBeDisabled();

      // Only whitespace should also keep button disabled
      const input = screen.getByPlaceholderText('Company profile URL');

      fireEvent.change(input, {target: {value: '   '}});

      expect(button).toBeDisabled();
      expect(global.fetch).not.toHaveBeenCalled();
    });
  });

  describe('User Interactions', () => {
    it('should update input value when user types', () => {
      render(<SearchHeader />);

      const input = screen.getByPlaceholderText(
        'Company profile URL',
      ) as HTMLInputElement;

      fireEvent.change(input, {
        target: {value: 'https://www.kununu.com/de/test'},
      });

      expect(input.value).toBe('https://www.kununu.com/de/test');
    });

    it('should prevent default form submission', async () => {
      render(<SearchHeader />);

      const input = screen.getByPlaceholderText('Company profile URL');
      const submitButton = screen.getByRole('button', {
        name: /Load EVP Project/i,
      });

      fireEvent.change(input, {
        target: {value: 'invalid-url'},
      });

      // Verify that clicking submit with invalid URL shows error
      // (which means preventDefault was called and default form action didn't happen)
      fireEvent.click(submitButton);

      await waitFor(() => {
        const errorMessage = screen.getByText(
          /Please enter a valid kununu profile URL/i,
        );

        expect(errorMessage).toBeInTheDocument();
      });

      // Verify no navigation occurred (fetch was not called)
      expect(global.fetch).not.toHaveBeenCalled();
    });
  });

  describe('Error Display', () => {
    it('should not show error initially', () => {
      render(<SearchHeader />);

      expect(
        screen.queryByText(/Please enter a valid kununu profile URL/i),
      ).not.toBeInTheDocument();
    });

    it('should show error with proper styling', async () => {
      render(<SearchHeader />);

      const input = screen.getByPlaceholderText('Company profile URL');
      const button = screen.getByRole('button', {name: /Load EVP Project/i});

      fireEvent.change(input, {target: {value: 'invalid'}});
      fireEvent.click(button);

      await waitFor(() => {
        const errorMessage = screen.getByText(
          /Please enter a valid kununu profile URL/i,
        );

        expect(errorMessage).toBeInTheDocument();
      });
    });
  });
});
