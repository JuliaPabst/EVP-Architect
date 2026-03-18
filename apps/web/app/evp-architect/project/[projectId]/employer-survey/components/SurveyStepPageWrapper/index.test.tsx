import '@testing-library/jest-dom';
import {render, screen} from '@testing-library/react';

import SurveyStepPageWrapper from '.';

jest.mock('@/app/hooks/useAdminTokenValidation', () => jest.fn());

jest.mock('@/app/components/KununuHeader', () => {
  return function MockKununuHeader() {
    return <header data-testid="header" />;
  };
});

jest.mock('@kununu/ui/atoms/UnunuBackground', () => ({
  __esModule: true,
  UnunuBackgroundColors: {YELLOW: 'yellow'},
  default: function MockBg() {
    return null;
  },
}));

describe('SurveyStepPageWrapper', () => {
  const DEFAULT_PROPS = {
    adminToken: 'test-admin-token',
    children: <div data-testid="child-content">Child</div>,
    projectId: 'test-project-123',
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('shows loading indicator when isValidating is true', () => {
    const useAdminTokenValidation = jest.requireMock(
      '@/app/hooks/useAdminTokenValidation',
    );

    useAdminTokenValidation.mockReturnValue({isValidating: true});

    render(<SurveyStepPageWrapper {...DEFAULT_PROPS} />);

    expect(screen.getByTestId('loading')).toBeInTheDocument();
    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  it('does not show children when isValidating is true', () => {
    const useAdminTokenValidation = jest.requireMock(
      '@/app/hooks/useAdminTokenValidation',
    );

    useAdminTokenValidation.mockReturnValue({isValidating: true});

    render(<SurveyStepPageWrapper {...DEFAULT_PROPS} />);

    expect(screen.queryByTestId('child-content')).not.toBeInTheDocument();
  });

  it('shows children when isValidating is false', () => {
    const useAdminTokenValidation = jest.requireMock(
      '@/app/hooks/useAdminTokenValidation',
    );

    useAdminTokenValidation.mockReturnValue({isValidating: false});

    render(<SurveyStepPageWrapper {...DEFAULT_PROPS} />);

    expect(screen.queryByTestId('loading')).not.toBeInTheDocument();
    expect(screen.getByTestId('child-content')).toBeInTheDocument();
  });

  it('renders KununuHeader regardless of validation state', () => {
    const useAdminTokenValidation = jest.requireMock(
      '@/app/hooks/useAdminTokenValidation',
    );

    useAdminTokenValidation.mockReturnValue({isValidating: false});

    render(<SurveyStepPageWrapper {...DEFAULT_PROPS} />);

    expect(screen.getByTestId('header')).toBeInTheDocument();
  });

  it('calls useAdminTokenValidation with the correct projectId and adminToken', () => {
    const useAdminTokenValidation = jest.requireMock(
      '@/app/hooks/useAdminTokenValidation',
    );

    useAdminTokenValidation.mockReturnValue({isValidating: false});

    render(<SurveyStepPageWrapper {...DEFAULT_PROPS} />);

    expect(useAdminTokenValidation).toHaveBeenCalledWith(
      'test-project-123',
      'test-admin-token',
    );
  });
});
