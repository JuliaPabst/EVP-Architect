import {act, renderHook} from '@testing-library/react';

import useEvpSettings from './useEvpSettings';

import useEmployerSurveyStep from '@/app/hooks/useEmployerSurveyStep';

jest.mock('@/app/hooks/useEmployerSurveyStep');

const mockUseEmployerSurveyStep = useEmployerSurveyStep as jest.MockedFunction<
  typeof useEmployerSurveyStep
>;

function makeStepData(overrides: Record<string, unknown> = {}) {
  return {
    questions: [
      {
        answer: {values: ['interne_kommunikation']},
        id: 'q-target',
        key: 'target_audience',
        options: [
          {
            label: 'Interne Kommunikation',
            prompt: null,
            value_key: 'interne_kommunikation',
          },
          {
            label: 'Externe Kommunikation',
            prompt: null,
            value_key: 'externe_kommunikation',
          },
          {
            label: 'Interne Analyse',
            prompt: null,
            value_key: 'interne_analyse',
          },
        ],
        prompt: 'Target audience',
        question_type: 'single_select',
        selection_limit: 1,
      },
      {
        answer: {text: 'Software engineers'},
        id: 'q-detail',
        key: 'target_audience_detail',
        options: [],
        prompt: 'Wen möchten Sie ansprechen?',
        question_type: 'text',
        selection_limit: null,
      },
      {
        answer: {values: ['formal']},
        id: 'q-style',
        key: 'tone_of_voice',
        options: [
          {label: 'Formal', prompt: null, value_key: 'formal'},
          {label: 'Casual', prompt: null, value_key: 'casual'},
        ],
        prompt: 'Tone of voice',
        question_type: 'single_select',
        selection_limit: 1,
      },
      {
        answer: {values: ['de']},
        id: 'q-lang',
        key: 'language',
        options: [
          {label: 'Deutsch', prompt: null, value_key: 'de'},
          {label: 'English', prompt: null, value_key: 'en'},
        ],
        prompt: 'Language',
        question_type: 'single_select',
        selection_limit: 1,
      },
    ],
    step: 5,
    ...overrides,
  };
}

describe('useEvpSettings', () => {
  const mockSaveAnswers = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();

    mockUseEmployerSurveyStep.mockReturnValue({
      error: null,
      isLoading: false,
      isSaving: false,
      saveAnswers: mockSaveAnswers,
      stepData: makeStepData(),
    } as ReturnType<typeof useEmployerSurveyStep>);
  });

  it('initialises with empty state before stepData loads', () => {
    mockUseEmployerSurveyStep.mockReturnValue({
      error: null,
      isLoading: true,
      isSaving: false,
      saveAnswers: mockSaveAnswers,
      stepData: null,
    } as ReturnType<typeof useEmployerSurveyStep>);

    const {result} = renderHook(() => useEvpSettings('project-123', 'token'));

    expect(result.current.selectedTargetAudience).toBe('');
    expect(result.current.selectedStyle).toBe('');
    expect(result.current.selectedLanguage).toBe('');
    expect(result.current.isLoading).toBe(true);
  });

  it('syncs selectedTargetAudience from step data', () => {
    const {result} = renderHook(() => useEvpSettings('project-123', 'token'));

    expect(result.current.selectedTargetAudience).toBe('interne_kommunikation');
  });

  it('syncs selectedStyle from step data', () => {
    const {result} = renderHook(() => useEvpSettings('project-123', 'token'));

    expect(result.current.selectedStyle).toBe('formal');
  });

  it('syncs selectedLanguage from step data', () => {
    const {result} = renderHook(() => useEvpSettings('project-123', 'token'));

    expect(result.current.selectedLanguage).toBe('de');
  });

  it('syncs targetAudienceDetail from step data when present', () => {
    const {result} = renderHook(() => useEvpSettings('project-123', 'token'));

    expect(result.current.targetAudienceDetail).toBe('Software engineers');
  });

  it('resets targetAudienceDetail to empty string when not present', () => {
    mockUseEmployerSurveyStep.mockReturnValue({
      error: null,
      isLoading: false,
      isSaving: false,
      saveAnswers: mockSaveAnswers,
      stepData: {
        ...makeStepData(),
        questions: makeStepData().questions.map(q =>
          q.key === 'target_audience_detail' ? {...q, answer: {text: null}} : q,
        ),
      },
    } as ReturnType<typeof useEmployerSurveyStep>);

    const {result} = renderHook(() => useEvpSettings('project-123', 'token'));

    expect(result.current.targetAudienceDetail).toBe('');
  });

  describe('outputType mapping', () => {
    it('returns "internal" for interne_kommunikation', () => {
      const {result} = renderHook(() => useEvpSettings('project-123', 'token'));

      expect(result.current.outputType).toBe('internal');
    });

    it('returns "external" for externe_kommunikation', () => {
      mockUseEmployerSurveyStep.mockReturnValue({
        error: null,
        isLoading: false,
        isSaving: false,
        saveAnswers: mockSaveAnswers,
        stepData: {
          ...makeStepData(),
          questions: makeStepData().questions.map(q =>
            q.key === 'target_audience'
              ? {...q, answer: {values: ['externe_kommunikation']}}
              : q,
          ),
        },
      } as ReturnType<typeof useEmployerSurveyStep>);

      const {result} = renderHook(() => useEvpSettings('project-123', 'token'));

      expect(result.current.outputType).toBe('external');
      expect(result.current.isExternalCommunication).toBe(true);
    });

    it('returns "gap_analysis" for interne_analyse', () => {
      mockUseEmployerSurveyStep.mockReturnValue({
        error: null,
        isLoading: false,
        isSaving: false,
        saveAnswers: mockSaveAnswers,
        stepData: {
          ...makeStepData(),
          questions: makeStepData().questions.map(q =>
            q.key === 'target_audience'
              ? {...q, answer: {values: ['interne_analyse']}}
              : q,
          ),
        },
      } as ReturnType<typeof useEmployerSurveyStep>);

      const {result} = renderHook(() => useEvpSettings('project-123', 'token'));

      expect(result.current.outputType).toBe('gap_analysis');
    });

    it('defaults to "internal" when targetAudience is unknown', () => {
      mockUseEmployerSurveyStep.mockReturnValue({
        error: null,
        isLoading: false,
        isSaving: false,
        saveAnswers: mockSaveAnswers,
        stepData: {
          ...makeStepData(),
          questions: makeStepData().questions.map(q =>
            q.key === 'target_audience' ? {...q, answer: {values: []}} : q,
          ),
        },
      } as ReturnType<typeof useEmployerSurveyStep>);

      const {result} = renderHook(() => useEvpSettings('project-123', 'token'));

      expect(result.current.outputType).toBe('internal');
    });
  });

  describe('options arrays', () => {
    it('builds targetAudienceOptions from question options', () => {
      const {result} = renderHook(() => useEvpSettings('project-123', 'token'));

      expect(result.current.targetAudienceOptions).toEqual([
        {
          id: 'interne_kommunikation',
          text: 'Interne Kommunikation',
          value: 'interne_kommunikation',
        },
        {
          id: 'externe_kommunikation',
          text: 'Externe Kommunikation',
          value: 'externe_kommunikation',
        },
        {
          id: 'interne_analyse',
          text: 'Interne Analyse',
          value: 'interne_analyse',
        },
      ]);
    });

    it('builds styleOptions from tone_of_voice question options', () => {
      const {result} = renderHook(() => useEvpSettings('project-123', 'token'));

      expect(result.current.styleOptions).toEqual([
        {id: 'formal', text: 'Formal', value: 'formal'},
        {id: 'casual', text: 'Casual', value: 'casual'},
      ]);
    });

    it('builds languageOptions from language question options', () => {
      const {result} = renderHook(() => useEvpSettings('project-123', 'token'));

      expect(result.current.languageOptions).toEqual([
        {id: 'de', text: 'Deutsch', value: 'de'},
        {id: 'en', text: 'English', value: 'en'},
      ]);
    });

    it('returns empty arrays when stepData has no questions', () => {
      mockUseEmployerSurveyStep.mockReturnValue({
        error: null,
        isLoading: false,
        isSaving: false,
        saveAnswers: mockSaveAnswers,
        stepData: null,
      } as ReturnType<typeof useEmployerSurveyStep>);

      const {result} = renderHook(() => useEvpSettings('project-123', 'token'));

      expect(result.current.targetAudienceOptions).toEqual([]);
      expect(result.current.styleOptions).toEqual([]);
      expect(result.current.languageOptions).toEqual([]);
    });
  });

  describe('state setters', () => {
    it('updates selectedTargetAudience via setter', () => {
      const {result} = renderHook(() => useEvpSettings('project-123', 'token'));

      act(() => {
        result.current.setSelectedTargetAudience('externe_kommunikation');
      });

      expect(result.current.selectedTargetAudience).toBe(
        'externe_kommunikation',
      );
    });

    it('updates selectedStyle via setter', () => {
      const {result} = renderHook(() => useEvpSettings('project-123', 'token'));

      act(() => {
        result.current.setSelectedStyle('casual');
      });

      expect(result.current.selectedStyle).toBe('casual');
    });

    it('updates selectedLanguage via setter', () => {
      const {result} = renderHook(() => useEvpSettings('project-123', 'token'));

      act(() => {
        result.current.setSelectedLanguage('en');
      });

      expect(result.current.selectedLanguage).toBe('en');
    });

    it('updates targetAudienceDetail via setter', () => {
      const {result} = renderHook(() => useEvpSettings('project-123', 'token'));

      act(() => {
        result.current.setTargetAudienceDetail('Product managers');
      });

      expect(result.current.targetAudienceDetail).toBe('Product managers');
    });
  });

  describe('saveSettings', () => {
    it('calls saveAnswers with all four answers when all are selected', async () => {
      mockSaveAnswers.mockResolvedValue(true);

      const {result} = renderHook(() => useEvpSettings('project-123', 'token'));

      await act(async () => {
        await result.current.saveSettings();
      });

      expect(mockSaveAnswers).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            question_id: 'q-target',
            selected_values: ['interne_kommunikation'],
          }),
          expect.objectContaining({question_id: 'q-detail'}),
          expect.objectContaining({
            question_id: 'q-style',
            selected_values: ['formal'],
          }),
          expect.objectContaining({
            question_id: 'q-lang',
            selected_values: ['de'],
          }),
        ]),
      );
    });

    it('returns true when saveAnswers succeeds', async () => {
      mockSaveAnswers.mockResolvedValue(true);

      const {result} = renderHook(() => useEvpSettings('project-123', 'token'));

      const saveResult = await result.current.saveSettings();

      expect(saveResult).toBe(true);
    });

    it('returns false when saveAnswers fails', async () => {
      mockSaveAnswers.mockResolvedValue(false);

      const {result} = renderHook(() => useEvpSettings('project-123', 'token'));

      const saveResult = await result.current.saveSettings();

      expect(saveResult).toBe(false);
    });

    it('clears targetAudienceDetail when not external communication', async () => {
      mockSaveAnswers.mockResolvedValue(true);

      const {result} = renderHook(() => useEvpSettings('project-123', 'token'));

      // interne_kommunikation is selected, so isExternalCommunication is false
      await act(async () => {
        await result.current.saveSettings();
      });

      const detailAnswer = (
        mockSaveAnswers.mock.calls[0][0] as {
          answer_text: string;
          question_id: string;
        }[]
      ).find(a => a.question_id === 'q-detail');

      expect(detailAnswer?.answer_text).toBe('');
    });

    it('includes targetAudienceDetail text when external communication', async () => {
      mockUseEmployerSurveyStep.mockReturnValue({
        error: null,
        isLoading: false,
        isSaving: false,
        saveAnswers: mockSaveAnswers,
        stepData: {
          ...makeStepData(),
          questions: makeStepData().questions.map(q =>
            q.key === 'target_audience'
              ? {...q, answer: {values: ['externe_kommunikation']}}
              : q,
          ),
        },
      } as ReturnType<typeof useEmployerSurveyStep>);

      mockSaveAnswers.mockResolvedValue(true);

      const {result} = renderHook(() => useEvpSettings('project-123', 'token'));

      await act(async () => {
        await result.current.saveSettings();
      });

      const detailAnswer = (
        mockSaveAnswers.mock.calls[0][0] as {
          answer_text: string;
          question_id: string;
        }[]
      ).find(a => a.question_id === 'q-detail');

      // targetAudienceDetail is 'Software engineers' from loaded step data
      expect(detailAnswer?.answer_text).toBe('Software engineers');
    });
  });

  describe('toSettings', () => {
    it('returns current settings as EvpGenerationSettings', () => {
      const {result} = renderHook(() => useEvpSettings('project-123', 'token'));

      const settings = result.current.toSettings();

      expect(settings).toEqual({
        language: 'de',
        targetAudience: 'interne_kommunikation',
        targetAudienceDetail: '',
        toneOfVoice: 'formal',
      });
    });

    it('includes targetAudienceDetail for external communication', () => {
      mockUseEmployerSurveyStep.mockReturnValue({
        error: null,
        isLoading: false,
        isSaving: false,
        saveAnswers: mockSaveAnswers,
        stepData: {
          ...makeStepData(),
          questions: makeStepData().questions.map(q =>
            q.key === 'target_audience'
              ? {...q, answer: {values: ['externe_kommunikation']}}
              : q,
          ),
        },
      } as ReturnType<typeof useEmployerSurveyStep>);

      const {result} = renderHook(() => useEvpSettings('project-123', 'token'));

      const settings = result.current.toSettings();

      expect(settings.targetAudienceDetail).toBe('Software engineers');
    });

    it('omits targetAudienceDetail for non-external communication', () => {
      const {result} = renderHook(() => useEvpSettings('project-123', 'token'));

      const settings = result.current.toSettings();

      expect(settings.targetAudienceDetail).toBe('');
    });
  });

  describe('targetAudienceDetailPrompt', () => {
    it('returns the question prompt from stepData', () => {
      const {result} = renderHook(() => useEvpSettings('project-123', 'token'));

      expect(result.current.targetAudienceDetailPrompt).toBe(
        'Wen möchten Sie ansprechen?',
      );
    });

    it('returns default prompt when stepData is null', () => {
      mockUseEmployerSurveyStep.mockReturnValue({
        error: null,
        isLoading: false,
        isSaving: false,
        saveAnswers: mockSaveAnswers,
        stepData: null,
      } as ReturnType<typeof useEmployerSurveyStep>);

      const {result} = renderHook(() => useEvpSettings('project-123', 'token'));

      expect(result.current.targetAudienceDetailPrompt).toBe(
        'Wen möchten Sie ansprechen?',
      );
    });
  });

  describe('settingsError', () => {
    it('exposes error from useEmployerSurveyStep', () => {
      mockUseEmployerSurveyStep.mockReturnValue({
        error: 'Failed to load settings',
        isLoading: false,
        isSaving: false,
        saveAnswers: mockSaveAnswers,
        stepData: null,
      } as ReturnType<typeof useEmployerSurveyStep>);

      const {result} = renderHook(() => useEvpSettings('project-123', 'token'));

      expect(result.current.settingsError).toBe('Failed to load settings');
    });
  });
});
