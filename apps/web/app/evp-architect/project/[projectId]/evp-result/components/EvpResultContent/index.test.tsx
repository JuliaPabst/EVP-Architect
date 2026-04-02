import {fireEvent, render, screen, waitFor} from '@testing-library/react';

import EvpResultContent from '.';

import useEvpResult from '@/app/hooks/useEvpResult';
import useEvpSettings from '@/app/hooks/useEvpSettings';

jest.mock(
  '@kununu/ui/atoms/FormInputWrapper',
  () =>
    function MockFormInputWrapper({
      children,
      label,
    }: {
      children: React.ReactNode;
      label: string;
    }) {
      return (
        <div
          data-testid={`form-wrapper-${label.replace(/\s+/g, '-').toLowerCase()}`}
        >
          {children}
        </div>
      );
    },
);

jest.mock(
  '@kununu/ui/atoms/TextInput',
  () =>
    function MockTextInput({
      id,
      onChange,
      placeholder,
      value,
    }: {
      id: string;
      onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
      value: string;
      placeholder?: string;
    }) {
      return (
        <input
          data-testid={`text-input-${id}`}
          id={id}
          onChange={onChange}
          placeholder={placeholder}
          value={value}
        />
      );
    },
);

jest.mock(
  '@kununu/ui/molecules/Select',
  () =>
    function MockSelect({
      id,
      onChange,
      value,
    }: {
      id: string;
      onChange: (selected: {value: string} | null) => void;
      value: string;
    }) {
      return (
        <select
          data-testid={`select-${id}`}
          id={id}
          onChange={e =>
            onChange(e.target.value ? {value: e.target.value} : null)
          }
          value={value}
        >
          <option value="">--</option>
          <option value="interne_kommunikation">Interne Kommunikation</option>
          <option value="externe_kommunikation">Externe Kommunikation</option>
          <option value="formal">Formal</option>
          <option value="de">Deutsch</option>
        </select>
      );
    },
);

jest.mock('@/app/hooks/useEvpSettings', () => jest.fn());
jest.mock('@/app/hooks/useEvpResult', () => jest.fn());

const mockUseEvpSettings = useEvpSettings as jest.MockedFunction<
  typeof useEvpSettings
>;
const mockUseEvpResult = useEvpResult as jest.MockedFunction<
  typeof useEvpResult
>;

function makeDefaultSettings() {
  return {
    isExternalCommunication: false,
    isLoading: false,
    isSaving: false,
    languageOptions: [{id: 'de', text: 'Deutsch', value: 'de'}],
    outputType: 'internal' as const,
    saveSettings: jest.fn().mockResolvedValue(true),
    selectedLanguage: 'de',
    selectedStyle: 'formal',
    selectedTargetAudience: 'interne_kommunikation',
    setSelectedLanguage: jest.fn(),
    setSelectedStyle: jest.fn(),
    setSelectedTargetAudience: jest.fn(),
    setTargetAudienceDetail: jest.fn(),
    settingsError: null,
    styleOptions: [{id: 'formal', text: 'Formal', value: 'formal'}],
    targetAudienceDetail: '',
    targetAudienceDetailPrompt: 'Wen möchten Sie ansprechen?',
    targetAudienceOptions: [
      {
        id: 'interne_kommunikation',
        text: 'Interne Kommunikation',
        value: 'interne_kommunikation',
      },
    ],
    toSettings: jest.fn().mockReturnValue({
      language: 'de',
      targetAudience: 'interne_kommunikation',
      targetAudienceDetail: '',
      toneOfVoice: 'formal',
    }),
  };
}

function makeDefaultEvpResult() {
  return {
    error: null,
    evpText: null,
    isLoading: false,
    isRegenerating: false,
    regenerate: jest.fn(),
  };
}

describe('EvpResultContent', () => {
  const defaultProps = {
    adminToken: 'test-token',
    projectId: 'project-123',
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseEvpSettings.mockReturnValue(
      makeDefaultSettings() as ReturnType<typeof useEvpSettings>,
    );
    mockUseEvpResult.mockReturnValue(
      makeDefaultEvpResult() as ReturnType<typeof useEvpResult>,
    );
  });

  describe('loading state', () => {
    it('shows loading message when isLoading is true', () => {
      mockUseEvpResult.mockReturnValue({
        ...makeDefaultEvpResult(),
        isLoading: true,
      } as ReturnType<typeof useEvpResult>);

      render(<EvpResultContent {...defaultProps} />);

      expect(screen.getByText('Generating EVP…')).toBeInTheDocument();
    });

    it('does not show loading message when isLoading is false', () => {
      render(<EvpResultContent {...defaultProps} />);

      expect(screen.queryByText('Generating EVP…')).not.toBeInTheDocument();
    });
  });

  describe('error state', () => {
    it('shows error message when error is set', () => {
      mockUseEvpResult.mockReturnValue({
        ...makeDefaultEvpResult(),
        error: 'Something went wrong',
      } as ReturnType<typeof useEvpResult>);

      render(<EvpResultContent {...defaultProps} />);

      expect(screen.getByText('Something went wrong')).toBeInTheDocument();
    });

    it('does not show error when error is null', () => {
      render(<EvpResultContent {...defaultProps} />);

      expect(
        screen.queryByText('Something went wrong'),
      ).not.toBeInTheDocument();
    });
  });

  describe('EVP text display', () => {
    it('shows EVP text when evpText is set', () => {
      mockUseEvpResult.mockReturnValue({
        ...makeDefaultEvpResult(),
        evpText: 'Our employees love working here.',
      } as ReturnType<typeof useEvpResult>);

      render(<EvpResultContent {...defaultProps} />);

      expect(
        screen.getByText('Our employees love working here.'),
      ).toBeInTheDocument();
    });

    it('does not show adjust section when evpText is null', () => {
      render(<EvpResultContent {...defaultProps} />);

      expect(screen.queryByText('Adjust EVP')).not.toBeInTheDocument();
    });

    it('shows adjust section when evpText is set', () => {
      mockUseEvpResult.mockReturnValue({
        ...makeDefaultEvpResult(),
        evpText: 'EVP content here',
      } as ReturnType<typeof useEvpResult>);

      render(<EvpResultContent {...defaultProps} />);

      expect(screen.getByText('Adjust EVP')).toBeInTheDocument();
    });
  });

  describe('settings form', () => {
    beforeEach(() => {
      mockUseEvpResult.mockReturnValue({
        ...makeDefaultEvpResult(),
        evpText: 'EVP content',
      } as ReturnType<typeof useEvpResult>);
    });

    it('renders target audience select', () => {
      render(<EvpResultContent {...defaultProps} />);

      expect(
        screen.getByTestId('select-evp-result-target-audience'),
      ).toBeInTheDocument();
    });

    it('renders tone of voice select', () => {
      render(<EvpResultContent {...defaultProps} />);

      expect(screen.getByTestId('select-evp-result-style')).toBeInTheDocument();
    });

    it('renders language select', () => {
      render(<EvpResultContent {...defaultProps} />);

      expect(
        screen.getByTestId('select-evp-result-language'),
      ).toBeInTheDocument();
    });

    it('does not show target audience detail field for internal communication', () => {
      render(<EvpResultContent {...defaultProps} />);

      expect(
        screen.queryByTestId('text-input-evp-result-target-audience-detail'),
      ).not.toBeInTheDocument();
    });

    it('shows target audience detail field for external communication', () => {
      mockUseEvpSettings.mockReturnValue({
        ...makeDefaultSettings(),
        isExternalCommunication: true,
      } as ReturnType<typeof useEvpSettings>);

      render(<EvpResultContent {...defaultProps} />);

      expect(
        screen.getByTestId('text-input-evp-result-target-audience-detail'),
      ).toBeInTheDocument();
    });

    it('shows settings error when settingsError is set', () => {
      mockUseEvpSettings.mockReturnValue({
        ...makeDefaultSettings(),
        settingsError: 'Settings could not be saved',
      } as ReturnType<typeof useEvpSettings>);

      render(<EvpResultContent {...defaultProps} />);

      expect(
        screen.getByText('Settings could not be saved'),
      ).toBeInTheDocument();
    });

    it('calls setSelectedTargetAudience when target audience is changed', () => {
      const mockSetTargetAudience = jest.fn();

      mockUseEvpSettings.mockReturnValue({
        ...makeDefaultSettings(),
        setSelectedTargetAudience: mockSetTargetAudience,
      } as ReturnType<typeof useEvpSettings>);

      render(<EvpResultContent {...defaultProps} />);

      fireEvent.change(
        screen.getByTestId('select-evp-result-target-audience'),
        {
          target: {value: 'externe_kommunikation'},
        },
      );

      expect(mockSetTargetAudience).toHaveBeenCalledWith(
        'externe_kommunikation',
      );
    });
  });

  describe('regenerate button', () => {
    beforeEach(() => {
      mockUseEvpResult.mockReturnValue({
        ...makeDefaultEvpResult(),
        evpText: 'EVP content',
      } as ReturnType<typeof useEvpResult>);
    });

    it('renders regenerate button', () => {
      render(<EvpResultContent {...defaultProps} />);

      expect(
        screen.getByRole('button', {name: 'Regenerate'}),
      ).toBeInTheDocument();
    });

    it('disables regenerate button when comment is empty', () => {
      render(<EvpResultContent {...defaultProps} />);

      expect(screen.getByRole('button', {name: 'Regenerate'})).toBeDisabled();
    });

    it('enables regenerate button when comment text is entered', () => {
      render(<EvpResultContent {...defaultProps} />);

      fireEvent.change(
        screen.getByPlaceholderText("Describe what you'd like to change…"),
        {target: {value: 'Make it shorter'}},
      );

      expect(screen.getByRole('button', {name: 'Regenerate'})).toBeEnabled();
    });

    it('disables button and shows Regenerating… when isRegenerating', () => {
      mockUseEvpResult.mockReturnValue({
        ...makeDefaultEvpResult(),
        evpText: 'EVP content',
        isRegenerating: true,
      } as ReturnType<typeof useEvpResult>);

      render(<EvpResultContent {...defaultProps} />);

      const button = screen.getByRole('button', {name: 'Regenerating…'});

      expect(button).toBeDisabled();
    });

    it('calls saveSettings and regenerate when Regenerate button is clicked', async () => {
      const mockSaveSettings = jest.fn().mockResolvedValue(true);
      const mockRegenerate = jest.fn().mockResolvedValue(undefined);

      mockUseEvpSettings.mockReturnValue({
        ...makeDefaultSettings(),
        saveSettings: mockSaveSettings,
        toSettings: jest.fn().mockReturnValue({
          language: 'de',
          targetAudience: 'interne_kommunikation',
          targetAudienceDetail: '',
          toneOfVoice: 'formal',
        }),
      } as ReturnType<typeof useEvpSettings>);

      mockUseEvpResult.mockReturnValue({
        ...makeDefaultEvpResult(),
        evpText: 'EVP content',
        regenerate: mockRegenerate,
      } as ReturnType<typeof useEvpResult>);

      render(<EvpResultContent {...defaultProps} />);

      fireEvent.change(
        screen.getByPlaceholderText("Describe what you'd like to change…"),
        {target: {value: 'Please adjust the tone'}},
      );

      fireEvent.click(screen.getByRole('button', {name: 'Regenerate'}));

      await waitFor(() => {
        expect(mockSaveSettings).toHaveBeenCalledTimes(1);
        expect(mockRegenerate).toHaveBeenCalledWith('Please adjust the tone', {
          language: 'de',
          targetAudience: 'interne_kommunikation',
          targetAudienceDetail: '',
          toneOfVoice: 'formal',
        });
      });
    });

    it('does not call regenerate when saveSettings returns false', async () => {
      const mockSaveSettings = jest.fn().mockResolvedValue(false);
      const mockRegenerate = jest.fn();

      mockUseEvpSettings.mockReturnValue({
        ...makeDefaultSettings(),
        saveSettings: mockSaveSettings,
      } as ReturnType<typeof useEvpSettings>);

      mockUseEvpResult.mockReturnValue({
        ...makeDefaultEvpResult(),
        evpText: 'EVP content',
        regenerate: mockRegenerate,
      } as ReturnType<typeof useEvpResult>);

      render(<EvpResultContent {...defaultProps} />);

      fireEvent.change(
        screen.getByPlaceholderText("Describe what you'd like to change…"),
        {target: {value: 'Change something'}},
      );

      fireEvent.click(screen.getByRole('button', {name: 'Regenerate'}));

      await waitFor(() => {
        expect(mockSaveSettings).toHaveBeenCalledTimes(1);
      });

      expect(mockRegenerate).not.toHaveBeenCalled();
    });

    it('clears comment text after successful regeneration', async () => {
      const mockSaveSettings = jest.fn().mockResolvedValue(true);
      const mockRegenerate = jest.fn().mockResolvedValue(undefined);

      mockUseEvpSettings.mockReturnValue({
        ...makeDefaultSettings(),
        saveSettings: mockSaveSettings,
        toSettings: jest.fn().mockReturnValue({}),
      } as ReturnType<typeof useEvpSettings>);

      mockUseEvpResult.mockReturnValue({
        ...makeDefaultEvpResult(),
        evpText: 'EVP content',
        regenerate: mockRegenerate,
      } as ReturnType<typeof useEvpResult>);

      render(<EvpResultContent {...defaultProps} />);

      const textarea = screen.getByPlaceholderText(
        "Describe what you'd like to change…",
      );

      fireEvent.change(textarea, {target: {value: 'Adjust this'}});
      expect(textarea).toHaveValue('Adjust this');

      fireEvent.click(screen.getByRole('button', {name: 'Regenerate'}));

      await waitFor(() => {
        expect(mockRegenerate).toHaveBeenCalled();
      });

      expect(textarea).toHaveValue('');
    });
  });

  describe('heading', () => {
    it('renders Your EVP heading', () => {
      render(<EvpResultContent {...defaultProps} />);

      expect(
        screen.getByRole('heading', {name: 'Your EVP'}),
      ).toBeInTheDocument();
    });
  });
});
