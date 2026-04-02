'use client';

import {useCallback, useEffect, useMemo, useState} from 'react';

import {ResultItem} from '@kununu/ui/shared/typings/resultItem';

import useEmployerSurveyStep from './useEmployerSurveyStep';

import {EvpOutputType} from '@/lib/types/pipeline';

export interface EvpGenerationSettings {
  readonly language: string;
  readonly targetAudience: string;
  readonly targetAudienceDetail: string;
  readonly toneOfVoice: string;
}

interface UseEvpSettingsReturn {
  readonly isExternalCommunication: boolean;
  readonly isLoading: boolean;
  readonly isSaving: boolean;
  readonly languageOptions: ResultItem[];
  readonly outputType: EvpOutputType;
  readonly saveSettings: () => Promise<boolean>;
  readonly selectedLanguage: string;
  readonly selectedStyle: string;
  readonly selectedTargetAudience: string;
  readonly setSelectedLanguage: (v: string) => void;
  readonly setSelectedStyle: (v: string) => void;
  readonly setSelectedTargetAudience: (v: string) => void;
  readonly setTargetAudienceDetail: (v: string) => void;
  readonly settingsError: string | null;
  readonly styleOptions: ResultItem[];
  readonly targetAudienceDetail: string;
  readonly targetAudienceDetailPrompt: string;
  readonly targetAudienceOptions: ResultItem[];
  readonly toSettings: () => EvpGenerationSettings;
}

/**
 * Custom hook to load and manage employer survey step-5 settings
 * (target audience, tone of voice, language) on the EVP results page.
 *
 * Purpose:
 *   - Fetches existing step-5 answers and question options
 *   - Holds local form state for the 4 settings fields
 *   - Exposes saveSettings() to persist changes back to the DB before generation
 *
 * @param projectId - UUID of the project
 * @param adminToken - Admin token for authentication
 */
export default function useEvpSettings(
  projectId: string,
  adminToken: string,
): UseEvpSettingsReturn {
  const {
    error: stepError,
    isLoading,
    isSaving,
    saveAnswers,
    stepData,
  } = useEmployerSurveyStep(projectId, 5, adminToken);

  const [selectedTargetAudience, setSelectedTargetAudience] = useState('');
  const [targetAudienceDetail, setTargetAudienceDetail] = useState('');
  const [selectedStyle, setSelectedStyle] = useState('');
  const [selectedLanguage, setSelectedLanguage] = useState('');

  const questions = stepData?.questions ?? [];

  const targetAudienceQuestion = questions.find(
    q => q.key === 'target_audience',
  );
  const targetAudienceDetailQuestion = questions.find(
    q => q.key === 'target_audience_detail',
  );
  const styleQuestion = questions.find(q => q.key === 'tone_of_voice');
  const languageQuestion = questions.find(q => q.key === 'language');

  // Sync state from loaded step data
  useEffect(() => {
    if (targetAudienceQuestion?.answer?.values?.[0]) {
      setSelectedTargetAudience(targetAudienceQuestion.answer.values[0]);
    }
  }, [targetAudienceQuestion?.answer?.values]);

  useEffect(() => {
    if (targetAudienceDetailQuestion?.answer?.text) {
      setTargetAudienceDetail(targetAudienceDetailQuestion.answer.text);
    } else {
      setTargetAudienceDetail('');
    }
  }, [targetAudienceDetailQuestion?.answer?.text]);

  useEffect(() => {
    if (styleQuestion?.answer?.values?.[0]) {
      setSelectedStyle(styleQuestion.answer.values[0]);
    }
  }, [styleQuestion?.answer?.values]);

  useEffect(() => {
    if (languageQuestion?.answer?.values?.[0]) {
      setSelectedLanguage(languageQuestion.answer.values[0]);
    }
  }, [languageQuestion?.answer?.values]);

  const isExternalCommunication =
    selectedTargetAudience === 'externe_kommunikation';

  const TARGET_AUDIENCE_TO_OUTPUT_TYPE: Record<string, EvpOutputType> = {
    externe_kommunikation: 'external',
    interne_analyse: 'gap_analysis',
    interne_kommunikation: 'internal',
  };

  const outputType: EvpOutputType =
    TARGET_AUDIENCE_TO_OUTPUT_TYPE[selectedTargetAudience] ?? 'internal';

  const targetAudienceOptions: ResultItem[] = useMemo(
    () =>
      (targetAudienceQuestion?.options ?? []).map(opt => ({
        id: opt.value_key,
        text: opt.label,
        value: opt.value_key,
      })),
    [targetAudienceQuestion?.options],
  );

  const styleOptions: ResultItem[] = useMemo(
    () =>
      (styleQuestion?.options ?? []).map(opt => ({
        id: opt.value_key,
        text: opt.label,
        value: opt.value_key,
      })),
    [styleQuestion?.options],
  );

  const languageOptions: ResultItem[] = useMemo(
    () =>
      (languageQuestion?.options ?? []).map(opt => ({
        id: opt.value_key,
        text: opt.label,
        value: opt.value_key,
      })),
    [languageQuestion?.options],
  );

  const saveSettings = useCallback(async (): Promise<boolean> => {
    const answers = [];

    if (targetAudienceQuestion && selectedTargetAudience) {
      answers.push({
        question_id: targetAudienceQuestion.id,
        selected_values: [selectedTargetAudience],
      });
    }

    if (targetAudienceDetailQuestion) {
      answers.push({
        answer_text: isExternalCommunication ? targetAudienceDetail.trim() : '',
        question_id: targetAudienceDetailQuestion.id,
      });
    }

    if (styleQuestion && selectedStyle) {
      answers.push({
        question_id: styleQuestion.id,
        selected_values: [selectedStyle],
      });
    }

    if (languageQuestion && selectedLanguage) {
      answers.push({
        question_id: languageQuestion.id,
        selected_values: [selectedLanguage],
      });
    }

    return saveAnswers(answers);
  }, [
    isExternalCommunication,
    languageQuestion,
    saveAnswers,
    selectedLanguage,
    selectedStyle,
    selectedTargetAudience,
    styleQuestion,
    targetAudienceDetail,
    targetAudienceDetailQuestion,
    targetAudienceQuestion,
  ]);

  const toSettings = useCallback(
    (): EvpGenerationSettings => ({
      language: selectedLanguage,
      targetAudience: selectedTargetAudience,
      targetAudienceDetail: isExternalCommunication ? targetAudienceDetail : '',
      toneOfVoice: selectedStyle,
    }),
    [
      isExternalCommunication,
      selectedLanguage,
      selectedStyle,
      selectedTargetAudience,
      targetAudienceDetail,
    ],
  );

  return {
    isExternalCommunication,
    isLoading,
    isSaving,
    languageOptions,
    outputType,
    saveSettings,
    selectedLanguage,
    selectedStyle,
    selectedTargetAudience,
    setSelectedLanguage,
    setSelectedStyle,
    setSelectedTargetAudience,
    setTargetAudienceDetail,
    settingsError: stepError,
    styleOptions,
    targetAudienceDetail,
    targetAudienceDetailPrompt:
      targetAudienceDetailQuestion?.prompt ?? 'Wen möchten Sie ansprechen?',
    targetAudienceOptions,
    toSettings,
  };
}
