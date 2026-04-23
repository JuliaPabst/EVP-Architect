import '@testing-library/jest-dom';
import {render, screen} from '@testing-library/react';

import EvpGenerationPage from './page';

jest.mock('@/app/hooks/useAdminToken', () => jest.fn());

jest.mock('@/app/hooks/useAdminTokenValidation', () => jest.fn());

jest.mock('@/app/components/KununuHeader', () => {
  return function MockKununuHeader() {
    return <header data-testid="kununu-header">Header</header>;
  };
});

jest.mock('./components/EvpGenerationContent', () => {
  return function MockEvpGenerationContent({
    adminToken,
    projectId,
  }: {
    adminToken: string;
    projectId: string;
  }) {
    return (
      <main
        data-admin-token={adminToken}
        data-project-id={projectId}
        data-testid="evp-generation-content"
      />
    );
  };
});

const MOCK_PARAMS = {projectId: 'test-project-123'};

describe('EvpGenerationPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders null when adminToken is null', () => {
    const useAdminToken = jest.requireMock('@/app/hooks/useAdminToken');
    const useAdminTokenValidation = jest.requireMock(
      '@/app/hooks/useAdminTokenValidation',
    );

    useAdminToken.mockReturnValue(null);
    useAdminTokenValidation.mockReturnValue({isValidating: false});

    const {container} = render(<EvpGenerationPage params={MOCK_PARAMS} />);

    expect(container).toBeEmptyDOMElement();
  });

  it('renders null when adminToken is undefined (still loading from hash)', () => {
    const useAdminToken = jest.requireMock('@/app/hooks/useAdminToken');
    const useAdminTokenValidation = jest.requireMock(
      '@/app/hooks/useAdminTokenValidation',
    );

    useAdminToken.mockReturnValue(undefined);
    useAdminTokenValidation.mockReturnValue({isValidating: true});

    const {container} = render(<EvpGenerationPage params={MOCK_PARAMS} />);

    expect(container).toBeEmptyDOMElement();
  });

  it('renders null when isValidating is true', () => {
    const useAdminToken = jest.requireMock('@/app/hooks/useAdminToken');
    const useAdminTokenValidation = jest.requireMock(
      '@/app/hooks/useAdminTokenValidation',
    );

    useAdminToken.mockReturnValue('test-token');
    useAdminTokenValidation.mockReturnValue({isValidating: true});

    const {container} = render(<EvpGenerationPage params={MOCK_PARAMS} />);

    expect(container).toBeEmptyDOMElement();
  });

  it('renders KununuHeader and EvpGenerationContent when token is valid', () => {
    const useAdminToken = jest.requireMock('@/app/hooks/useAdminToken');
    const useAdminTokenValidation = jest.requireMock(
      '@/app/hooks/useAdminTokenValidation',
    );

    useAdminToken.mockReturnValue('test-token');
    useAdminTokenValidation.mockReturnValue({isValidating: false});

    render(<EvpGenerationPage params={MOCK_PARAMS} />);

    expect(screen.getByTestId('kununu-header')).toBeInTheDocument();
    expect(screen.getByTestId('evp-generation-content')).toBeInTheDocument();
  });

  it('passes adminToken and projectId to EvpGenerationContent', () => {
    const useAdminToken = jest.requireMock('@/app/hooks/useAdminToken');
    const useAdminTokenValidation = jest.requireMock(
      '@/app/hooks/useAdminTokenValidation',
    );

    useAdminToken.mockReturnValue('my-admin-token');
    useAdminTokenValidation.mockReturnValue({isValidating: false});

    render(<EvpGenerationPage params={MOCK_PARAMS} />);

    const content = screen.getByTestId('evp-generation-content');

    expect(content).toHaveAttribute('data-admin-token', 'my-admin-token');
    expect(content).toHaveAttribute('data-project-id', 'test-project-123');
  });

  it('calls useAdminToken with projectId', () => {
    const useAdminToken = jest.requireMock('@/app/hooks/useAdminToken');
    const useAdminTokenValidation = jest.requireMock(
      '@/app/hooks/useAdminTokenValidation',
    );

    useAdminToken.mockReturnValue('test-token');
    useAdminTokenValidation.mockReturnValue({isValidating: false});

    render(<EvpGenerationPage params={MOCK_PARAMS} />);

    expect(useAdminToken).toHaveBeenCalledWith('test-project-123');
  });

  it('calls useAdminTokenValidation with projectId and adminToken', () => {
    const useAdminToken = jest.requireMock('@/app/hooks/useAdminToken');
    const useAdminTokenValidation = jest.requireMock(
      '@/app/hooks/useAdminTokenValidation',
    );

    useAdminToken.mockReturnValue('test-token');
    useAdminTokenValidation.mockReturnValue({isValidating: false});

    render(<EvpGenerationPage params={MOCK_PARAMS} />);

    expect(useAdminTokenValidation).toHaveBeenCalledWith(
      'test-project-123',
      'test-token',
    );
  });
});
