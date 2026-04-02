import {render, screen} from '@testing-library/react';

import EvpResultPage from './page';

import useAdminToken from '@/app/hooks/useAdminToken';
import useAdminTokenValidation from '@/app/hooks/useAdminTokenValidation';

jest.mock(
  '@/app/components/KununuHeader',
  () =>
    function MockKununuHeader() {
      return <div data-testid="kununu-header" />;
    },
);

jest.mock(
  './components/EvpResultContent',
  () =>
    function MockEvpResultContent({
      adminToken,
      projectId,
    }: {
      adminToken: string;
      projectId: string;
    }) {
      return (
        <div
          data-admin-token={adminToken}
          data-project-id={projectId}
          data-testid="evp-result-content"
        />
      );
    },
);

jest.mock('@/app/hooks/useAdminToken', () => jest.fn());
jest.mock('@/app/hooks/useAdminTokenValidation', () => jest.fn());

const mockUseAdminToken = useAdminToken as jest.MockedFunction<
  typeof useAdminToken
>;
const mockUseAdminTokenValidation =
  useAdminTokenValidation as jest.MockedFunction<
    typeof useAdminTokenValidation
  >;

describe('EvpResultPage', () => {
  const mockParams = {projectId: 'project-123'};

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns null while validating', () => {
    mockUseAdminToken.mockReturnValue('test-token');
    mockUseAdminTokenValidation.mockReturnValue({
      companyName: '',
      isValidating: true,
    });

    const {container} = render(<EvpResultPage params={mockParams} />);

    expect(container).toBeEmptyDOMElement();
  });

  it('renders the page content when validation is complete', () => {
    mockUseAdminToken.mockReturnValue('test-token');
    mockUseAdminTokenValidation.mockReturnValue({
      companyName: 'Test Corp',
      isValidating: false,
    });

    render(<EvpResultPage params={mockParams} />);

    expect(screen.getByTestId('evp-result-page')).toBeInTheDocument();
    expect(screen.getByTestId('kununu-header')).toBeInTheDocument();
    expect(screen.getByTestId('evp-result-content')).toBeInTheDocument();
  });

  it('passes projectId to EvpResultContent', () => {
    mockUseAdminToken.mockReturnValue('test-token');
    mockUseAdminTokenValidation.mockReturnValue({
      companyName: 'Test Corp',
      isValidating: false,
    });

    render(<EvpResultPage params={mockParams} />);

    expect(screen.getByTestId('evp-result-content')).toHaveAttribute(
      'data-project-id',
      'project-123',
    );
  });

  it('passes adminToken to EvpResultContent', () => {
    mockUseAdminToken.mockReturnValue('my-admin-token');
    mockUseAdminTokenValidation.mockReturnValue({
      companyName: 'Test Corp',
      isValidating: false,
    });

    render(<EvpResultPage params={mockParams} />);

    expect(screen.getByTestId('evp-result-content')).toHaveAttribute(
      'data-admin-token',
      'my-admin-token',
    );
  });

  it('passes empty string for adminToken when token is null', () => {
    mockUseAdminToken.mockReturnValue(null);
    mockUseAdminTokenValidation.mockReturnValue({
      companyName: '',
      isValidating: false,
    });

    render(<EvpResultPage params={mockParams} />);

    expect(screen.getByTestId('evp-result-content')).toHaveAttribute(
      'data-admin-token',
      '',
    );
  });

  it('calls useAdminToken with projectId', () => {
    mockUseAdminToken.mockReturnValue('token');
    mockUseAdminTokenValidation.mockReturnValue({
      companyName: '',
      isValidating: false,
    });

    render(<EvpResultPage params={mockParams} />);

    expect(mockUseAdminToken).toHaveBeenCalledWith('project-123');
  });

  it('calls useAdminTokenValidation with projectId and token', () => {
    mockUseAdminToken.mockReturnValue('my-token');
    mockUseAdminTokenValidation.mockReturnValue({
      companyName: '',
      isValidating: false,
    });

    render(<EvpResultPage params={mockParams} />);

    expect(mockUseAdminTokenValidation).toHaveBeenCalledWith(
      'project-123',
      'my-token',
    );
  });
});
