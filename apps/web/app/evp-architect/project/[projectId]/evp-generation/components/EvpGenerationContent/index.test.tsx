import '@testing-library/jest-dom';
import {fireEvent, render, screen, waitFor} from '@testing-library/react';

import EvpGenerationContent from '.';

jest.mock('@/app/hooks/useEvpResult', () => jest.fn());

jest.mock('@/app/hooks/useEvpSettings', () => jest.fn());

jest.mock('@kununu/ui/atoms/Button', () => ({
  __esModule: true,
  ButtonColor: {AI: 'ai', PRIMARY: 'primary'},
  default: function MockButton({
    disabled,
    onClick,
    text,
  }: {
    text: string;
    disabled?: boolean;
    onClick?: () => void;
  }) {
    return (
      <button disabled={disabled} onClick={onClick} type="button">
        {text}
      </button>
    );
  },
}));

jest.mock('@kununu/ui/atoms/FormInputWrapper', () => ({
  __esModule: true,
  default: function MockFormInputWrapper({
    children,
    label,
  }: {
    children: React.ReactNode;
    label?: string;
  }) {
    return <div data-label={label}>{children}</div>;
  },
}));

jest.mock('@kununu/ui/atoms/Icon', () => ({
  __esModule: true,
  default: () => null,
  IconSize: {M: 'm'},
}));

jest.mock('@kununu/ui/atoms/Icon/Icons/Download', () => ({
  __esModule: true,
  default: {},
}));

jest.mock('@kununu/ui/atoms/Icon/Icons/Sparks', () => ({
  __esModule: true,
  default: {},
}));

jest.mock('@kununu/ui/atoms/Illustration/Illustrations/Spot/Rocket', () => ({
  __esModule: true,
  default: function MockRocket() {
    return <div data-testid="rocket-illustration" />;
  },
}));

jest.mock('@kununu/ui/atoms/TextInput', () => ({
  __esModule: true,
  default: function MockTextInput({
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
        id={id}
        onChange={onChange}
        placeholder={placeholder}
        value={value}
      />
    );
  },
}));

jest.mock('@kununu/ui/atoms/UnunuBackground', () => ({
  __esModule: true,
  default: () => null,
  UnunuBackgroundColors: {YELLOW: 'yellow'},
}));

jest.mock('@kununu/ui/molecules/ClipboardCopy', () => ({
  __esModule: true,
  default: function MockClipboardCopy({content}: {content: string}) {
    return (
      <div data-content={content} data-testid="clipboard-copy">
        {content}
      </div>
    );
  },
}));

jest.mock('@kununu/ui/molecules/Select', () => ({
  __esModule: true,
  default: function MockSelect({
    id,
    onChange,
    placeholder,
    value,
  }: {
    id: string;
    onChange: (item: {id: string; text: string; value: string} | null) => void;
    value: string;
    placeholder?: string;
  }) {
    return (
      <select
        data-testid={id}
        id={id}
        onChange={e =>
          onChange(
            e.target.value
              ? {
                  id: e.target.value,
                  text: e.target.value,
                  value: e.target.value,
                }
              : null,
          )
        }
        value={value}
      >
        <option value="">{placeholder ?? 'Select'}</option>
        <option value="test-value">Test Option</option>
      </select>
    );
  },
}));

const DEFAULT_SETTINGS = {
  isExternalCommunication: false,
  isLoading: false,
  isSaving: false,
  languageOptions: [{id: 'de', text: 'Deutsch', value: 'de'}],
  outputType: 'internal' as const,
  saveSettings: jest.fn().mockResolvedValue(true),
  selectedLanguage: 'de',
  selectedStyle: 'professional',
  selectedTargetAudience: 'interne_kommunikation',
  setSelectedLanguage: jest.fn(),
  setSelectedStyle: jest.fn(),
  setSelectedTargetAudience: jest.fn(),
  setTargetAudienceDetail: jest.fn(),
  settingsError: null,
  styleOptions: [
    {id: 'professional', text: 'Professionell', value: 'professional'},
  ],
  targetAudienceDetail: '',
  targetAudienceDetailPrompt: 'Wen möchten Sie ansprechen?',
  targetAudienceOptions: [
    {
      id: 'interne_kommunikation',
      text: 'Intern',
      value: 'interne_kommunikation',
    },
  ],
  toSettings: jest.fn().mockReturnValue({
    language: 'de',
    targetAudience: 'interne_kommunikation',
    targetAudienceDetail: '',
    toneOfVoice: 'professional',
  }),
};

const DEFAULT_RESULT = {
  error: null,
  evpText: null,
  isLoading: false,
  isRegenerating: false,
  regenerate: jest.fn().mockResolvedValue(undefined),
};

function setupMocks(
  settingsOverrides: Partial<typeof DEFAULT_SETTINGS> = {},
  resultOverrides: Partial<typeof DEFAULT_RESULT> = {},
) {
  const useEvpSettings = jest.requireMock('@/app/hooks/useEvpSettings');
  const useEvpResult = jest.requireMock('@/app/hooks/useEvpResult');

  useEvpSettings.mockReturnValue({...DEFAULT_SETTINGS, ...settingsOverrides});
  useEvpResult.mockReturnValue({...DEFAULT_RESULT, ...resultOverrides});
}

const DEFAULT_PROPS = {
  adminToken: 'test-admin-token',
  projectId: 'test-project-123',
};

describe('EvpGenerationContent', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    setupMocks();
  });

  describe('Hero section', () => {
    it('renders the hero heading', () => {
      render(<EvpGenerationContent {...DEFAULT_PROPS} />);

      expect(screen.getByRole('heading', {level: 1})).toHaveTextContent(
        'Employer Value Proposition',
      );
    });

    it('renders the rocket illustration', () => {
      render(<EvpGenerationContent {...DEFAULT_PROPS} />);

      expect(screen.getByTestId('rocket-illustration')).toBeInTheDocument();
    });

    it('renders the hero subtitle', () => {
      render(<EvpGenerationContent {...DEFAULT_PROPS} />);

      expect(
        screen.getByText(/Alles bereit! Deine Employer Value Proposition/),
      ).toBeInTheDocument();
    });
  });

  describe('Share link card', () => {
    it('renders the share link card heading', () => {
      render(<EvpGenerationContent {...DEFAULT_PROPS} />);

      expect(
        screen.getByText(
          'Mehrere Perspektiven sind der Schlüssel zu einer starken EVP',
        ),
      ).toBeInTheDocument();
    });

    it('renders clipboard copy with the employee survey URL', () => {
      render(<EvpGenerationContent {...DEFAULT_PROPS} />);

      const clipboardCopy = screen.getByTestId('clipboard-copy');

      expect(clipboardCopy).toBeInTheDocument();
      expect(clipboardCopy).toHaveAttribute(
        'data-content',
        expect.stringContaining(
          '/evp-architect/project/test-project-123/employee-survey/step-1',
        ),
      );
    });
  });

  describe('EVP card – settings form', () => {
    it('renders the target audience select', () => {
      render(<EvpGenerationContent {...DEFAULT_PROPS} />);

      expect(screen.getByTestId('evp-gen-target-audience')).toBeInTheDocument();
    });

    it('renders the style select', () => {
      render(<EvpGenerationContent {...DEFAULT_PROPS} />);

      expect(screen.getByTestId('evp-gen-style')).toBeInTheDocument();
    });

    it('renders the language select', () => {
      render(<EvpGenerationContent {...DEFAULT_PROPS} />);

      expect(screen.getByTestId('evp-gen-language')).toBeInTheDocument();
    });

    it('hides target audience detail input when isExternalCommunication is false', () => {
      setupMocks({isExternalCommunication: false});

      render(<EvpGenerationContent {...DEFAULT_PROPS} />);

      expect(
        screen.queryByPlaceholderText('Wen möchten Sie ansprechen?'),
      ).not.toBeInTheDocument();
    });

    it('shows target audience detail input when isExternalCommunication is true', () => {
      setupMocks({
        isExternalCommunication: true,
        selectedTargetAudience: 'externe_kommunikation',
        targetAudienceDetailPrompt: 'Wen möchten Sie ansprechen?',
      });

      render(<EvpGenerationContent {...DEFAULT_PROPS} />);

      expect(
        screen.getByPlaceholderText('Wen möchten Sie ansprechen?'),
      ).toBeInTheDocument();
    });

    it('shows settingsError when present', () => {
      setupMocks({settingsError: 'Fehler beim Speichern der Einstellungen'});

      render(<EvpGenerationContent {...DEFAULT_PROPS} />);

      expect(
        screen.getByText('Fehler beim Speichern der Einstellungen'),
      ).toBeInTheDocument();
    });
  });

  describe('Generate button', () => {
    it('is enabled when all settings are selected', () => {
      render(<EvpGenerationContent {...DEFAULT_PROPS} />);

      expect(
        screen.getByRole('button', {name: 'EVP generieren'}),
      ).toBeEnabled();
    });

    it('is disabled when selectedTargetAudience is empty', () => {
      setupMocks({selectedTargetAudience: ''});

      render(<EvpGenerationContent {...DEFAULT_PROPS} />);

      expect(
        screen.getByRole('button', {name: 'EVP generieren'}),
      ).toBeDisabled();
    });

    it('is disabled when selectedStyle is empty', () => {
      setupMocks({selectedStyle: ''});

      render(<EvpGenerationContent {...DEFAULT_PROPS} />);

      expect(
        screen.getByRole('button', {name: 'EVP generieren'}),
      ).toBeDisabled();
    });

    it('is disabled when selectedLanguage is empty', () => {
      setupMocks({selectedLanguage: ''});

      render(<EvpGenerationContent {...DEFAULT_PROPS} />);

      expect(
        screen.getByRole('button', {name: 'EVP generieren'}),
      ).toBeDisabled();
    });

    it('is disabled when isExternalCommunication and targetAudienceDetail is empty', () => {
      setupMocks({
        isExternalCommunication: true,
        selectedTargetAudience: 'externe_kommunikation',
        targetAudienceDetail: '',
      });

      render(<EvpGenerationContent {...DEFAULT_PROPS} />);

      expect(
        screen.getByRole('button', {name: 'EVP generieren'}),
      ).toBeDisabled();
    });

    it('is enabled when isExternalCommunication and targetAudienceDetail is filled', () => {
      setupMocks({
        isExternalCommunication: true,
        selectedTargetAudience: 'externe_kommunikation',
        targetAudienceDetail: 'Softwareentwickler',
      });

      render(<EvpGenerationContent {...DEFAULT_PROPS} />);

      expect(
        screen.getByRole('button', {name: 'EVP generieren'}),
      ).toBeEnabled();
    });

    it('is disabled when isRegenerating is true', () => {
      setupMocks({}, {isRegenerating: true});

      render(<EvpGenerationContent {...DEFAULT_PROPS} />);

      expect(
        screen.getByRole('button', {name: 'EVP generieren'}),
      ).toBeDisabled();
    });
  });

  describe('handleGenerate', () => {
    it('calls saveSettings then regenerate on click', async () => {
      const mockSaveSettings = jest.fn().mockResolvedValue(true);
      const mockRegenerate = jest.fn().mockResolvedValue(undefined);
      const mockToSettings = jest.fn().mockReturnValue({
        language: 'de',
        targetAudience: 'interne_kommunikation',
        targetAudienceDetail: '',
        toneOfVoice: 'professional',
      });

      setupMocks(
        {saveSettings: mockSaveSettings, toSettings: mockToSettings},
        {regenerate: mockRegenerate},
      );

      render(<EvpGenerationContent {...DEFAULT_PROPS} />);

      fireEvent.click(screen.getByRole('button', {name: 'EVP generieren'}));

      await waitFor(() => {
        expect(mockSaveSettings).toHaveBeenCalledTimes(1);
        expect(mockRegenerate).toHaveBeenCalledWith('', mockToSettings());
      });
    });

    it('does not call regenerate when saveSettings returns false', async () => {
      const mockSaveSettings = jest.fn().mockResolvedValue(false);
      const mockRegenerate = jest.fn().mockResolvedValue(undefined);

      setupMocks(
        {saveSettings: mockSaveSettings},
        {regenerate: mockRegenerate},
      );

      render(<EvpGenerationContent {...DEFAULT_PROPS} />);

      fireEvent.click(screen.getByRole('button', {name: 'EVP generieren'}));

      await waitFor(() => {
        expect(mockSaveSettings).toHaveBeenCalledTimes(1);
        expect(mockRegenerate).not.toHaveBeenCalled();
      });
    });
  });

  describe('Preview section', () => {
    it('is not shown when there is no evpText, error or isLoading', () => {
      render(<EvpGenerationContent {...DEFAULT_PROPS} />);

      expect(screen.queryByText('Vorschau')).not.toBeInTheDocument();
    });

    it('shows loading message when isLoading is true', () => {
      setupMocks({}, {isLoading: true});

      render(<EvpGenerationContent {...DEFAULT_PROPS} />);

      expect(screen.getByText('Vorschau')).toBeInTheDocument();
      expect(screen.getByText('EVP wird generiert…')).toBeInTheDocument();
    });

    it('shows error message when error is set', () => {
      setupMocks({}, {error: 'Fehler bei der Generierung'});

      render(<EvpGenerationContent {...DEFAULT_PROPS} />);

      expect(screen.getByText('Vorschau')).toBeInTheDocument();
      expect(
        screen.getByText('Fehler bei der Generierung'),
      ).toBeInTheDocument();
    });

    it('shows EVP text when evpText is set', () => {
      setupMocks({}, {evpText: 'Dies ist unsere EVP.'});

      render(<EvpGenerationContent {...DEFAULT_PROPS} />);

      expect(screen.getByText('Vorschau')).toBeInTheDocument();
      expect(screen.getByText('Dies ist unsere EVP.')).toBeInTheDocument();
    });

    it('shows PDF download button when evpText is set', () => {
      setupMocks({}, {evpText: 'Sample EVP text'});

      render(<EvpGenerationContent {...DEFAULT_PROPS} />);

      expect(
        screen.getByRole('button', {name: 'PDF herunterladen'}),
      ).toBeInTheDocument();
    });

    it('does not show PDF download button when evpText is null', () => {
      render(<EvpGenerationContent {...DEFAULT_PROPS} />);

      expect(
        screen.queryByRole('button', {name: 'PDF herunterladen'}),
      ).not.toBeInTheDocument();
    });
  });

  describe('renderEvpText – markdown formatting', () => {
    it('renders markdown heading as h2 element', () => {
      setupMocks({}, {evpText: '## Unsere Werte'});

      render(<EvpGenerationContent {...DEFAULT_PROPS} />);

      const heading = screen.getByRole('heading', {level: 2});

      expect(heading).toHaveTextContent('Unsere Werte');
    });

    it('renders markdown h1 as h1 element', () => {
      setupMocks({}, {evpText: '# Haupttitel'});

      render(<EvpGenerationContent {...DEFAULT_PROPS} />);

      expect(
        screen.getByRole('heading', {level: 1, name: 'Haupttitel'}),
      ).toBeInTheDocument();
    });

    it('renders bold text as strong element', () => {
      setupMocks({}, {evpText: 'Wir sind **innovativ** und kreativ.'});

      render(<EvpGenerationContent {...DEFAULT_PROPS} />);

      expect(screen.getByText('innovativ')).toBeInTheDocument();
      expect(screen.getByText('innovativ').tagName).toBe('STRONG');
    });

    it('renders normal text as paragraph', () => {
      setupMocks({}, {evpText: 'Einfacher Text ohne Formatierung.'});

      render(<EvpGenerationContent {...DEFAULT_PROPS} />);

      expect(
        screen.getByText('Einfacher Text ohne Formatierung.'),
      ).toBeInTheDocument();
    });
  });

  describe('PDF download', () => {
    it('creates a blob URL and sets iframe src on PDF button click', () => {
      setupMocks({}, {evpText: 'Sample EVP text'});
      render(<EvpGenerationContent {...DEFAULT_PROPS} />);

      const mockCreateObjectURL = jest
        .fn()
        .mockReturnValue('blob:http://localhost/test');
      const mockRevokeObjectURL = jest.fn();

      global.URL.createObjectURL = mockCreateObjectURL;
      global.URL.revokeObjectURL = mockRevokeObjectURL;

      const mockIframe = {
        contentWindow: null,
        onload: null as ((this: HTMLElement, ev: Event) => unknown) | null,
        src: '',
        style: {cssText: ''},
      };

      const originalCreateElement = document.createElement.bind(document);

      jest.spyOn(document, 'createElement').mockImplementation(tag => {
        if (tag === 'iframe') {
          return mockIframe as unknown as HTMLIFrameElement;
        }

        return originalCreateElement(tag);
      });

      jest
        .spyOn(document.body, 'appendChild')
        .mockImplementation(() => mockIframe as unknown as Node);

      fireEvent.click(screen.getByRole('button', {name: 'PDF herunterladen'}));

      expect(mockCreateObjectURL).toHaveBeenCalledTimes(1);
      expect(mockIframe.src).toBe('blob:http://localhost/test');

      jest.restoreAllMocks();
    });
  });
});
