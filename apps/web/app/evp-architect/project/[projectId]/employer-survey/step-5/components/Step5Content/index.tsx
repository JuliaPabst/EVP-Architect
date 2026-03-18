'use client';

import {useState, useMemo, useEffect} from 'react';

import FormInputWrapper from '@kununu/ui/atoms/FormInputWrapper';
import TextInput from '@kununu/ui/atoms/TextInput';
import Select from '@kununu/ui/molecules/Select';
import {ResultItem} from '@kununu/ui/shared/typings/resultItem';

import StepContentLayout from '../../../components/StepContentLayout';
import useStepNavigation from '../../../hooks/useStepNavigation';
import NavigationButtons from '../../../step-1/components/NavigationButtons';

import styles from './index.module.scss';

import useEmployerSurveyStep from '@/app/hooks/useEmployerSurveyStep';

interface Step5ContentProps {
  readonly adminToken: string | null;
  readonly projectId: string;
}

export default function Step5Content({
  adminToken,
  projectId,
}: Step5ContentProps) {
  const {
    error: stepError,
    isLoading,
    isSaving,
    saveAnswers,
    stepData,
  } = useEmployerSurveyStep(projectId, 5, adminToken);
  const {navigateToPreviousStep, navigateToProject} = useStepNavigation(
    projectId,
    5,
    adminToken,
  );

  const [completeError, setCompleteError] = useState<string | null>(null);
  const error = stepError ?? completeError;

  const questions = stepData?.questions || [];

  // Find questions by their keys
  const targetAudienceQuestion = questions.find(
    q => q.key === 'target_audience',
  );
  const targetAudienceDetailQuestion = questions.find(
    q => q.key === 'target_audience_detail',
  );
  const styleQuestion = questions.find(q => q.key === 'tone_of_voice');
  const languageQuestion = questions.find(q => q.key === 'language');

  // Local state for form fields
  const [selectedTargetAudience, setSelectedTargetAudience] = useState('');
  const [targetAudienceDetail, setTargetAudienceDetail] = useState('');
  const [selectedStyle, setSelectedStyle] = useState('');
  const [selectedLanguage, setSelectedLanguage] = useState('');

  // Sync state with loaded data
  useEffect(() => {
    if (targetAudienceQuestion?.answer?.values?.[0]) {
      setSelectedTargetAudience(targetAudienceQuestion.answer.values[0]);
    }
  }, [targetAudienceQuestion?.answer?.values]);

  useEffect(() => {
    if (targetAudienceDetailQuestion?.answer?.text) {
      setTargetAudienceDetail(targetAudienceDetailQuestion.answer.text);
    } else {
      // Clear detail if no answer exists
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

  // Check if "External Communication" is selected
  const isExternalCommunication =
    selectedTargetAudience === 'externe_kommunikation';

  // Check if target audience detail is required and available
  const isDetailRequired =
    isExternalCommunication && targetAudienceDetailQuestion;

  // Convert options to ResultItem format
  const targetAudienceOptions: ResultItem[] = useMemo(
    () =>
      (targetAudienceQuestion?.options || []).map(opt => ({
        id: opt.value_key,
        text: opt.label,
        value: opt.value_key,
      })),
    [targetAudienceQuestion],
  );

  const styleOptions: ResultItem[] = useMemo(
    () =>
      (styleQuestion?.options || []).map(opt => ({
        id: opt.value_key,
        text: opt.label,
        value: opt.value_key,
      })),
    [styleQuestion],
  );

  const languageOptions: ResultItem[] = useMemo(
    () =>
      (languageQuestion?.options || []).map(opt => ({
        id: opt.value_key,
        text: opt.label,
        value: opt.value_key,
      })),
    [languageQuestion],
  );

  // Validation
  const canContinue = Boolean(
    selectedTargetAudience &&
      selectedStyle &&
      selectedLanguage &&
      (!isDetailRequired || targetAudienceDetail.trim()),
  );

  const handleContinue = async () => {
    if (!adminToken || !stepData || !canContinue) {
      return;
    }

    const answers = [];

    // Target Audience
    if (targetAudienceQuestion && selectedTargetAudience) {
      answers.push({
        question_id: targetAudienceQuestion.id,
        selected_values: [selectedTargetAudience],
      });
    }

    // Target Audience Detail (only if question exists, external communication is selected, and has text)
    if (
      targetAudienceDetailQuestion &&
      isExternalCommunication &&
      targetAudienceDetail.trim()
    ) {
      answers.push({
        answer_text: targetAudienceDetail.trim(),
        question_id: targetAudienceDetailQuestion.id,
      });
    }

    // Style
    if (styleQuestion && selectedStyle) {
      answers.push({
        question_id: styleQuestion.id,
        selected_values: [selectedStyle],
      });
    }

    // Language
    if (languageQuestion && selectedLanguage) {
      answers.push({
        question_id: languageQuestion.id,
        selected_values: [selectedLanguage],
      });
    }

    const saved = await saveAnswers(answers);

    if (!saved) return;

    const response = await fetch(
      `/api/employer-survey/complete?projectId=${projectId}&admin_token=${adminToken}`,
      {method: 'POST'},
    );

    if (!response.ok) {
      const errorData = await response.json();

      setCompleteError(errorData.message || 'Failed to complete survey');
      return;
    }

    navigateToProject();
  };

  // Show error if no data loaded
  if (
    !isLoading &&
    (!stepData ||
      !targetAudienceQuestion ||
      !styleQuestion ||
      !languageQuestion)
  ) {
    return (
      <StepContentLayout
        currentStep={5}
        error="Failed to load survey questions"
        isLoading={false}
        stepTitle="Final steps"
      >
        <div />
      </StepContentLayout>
    );
  }

  return (
    <StepContentLayout
      currentStep={5}
      error={error}
      isLoading={isLoading}
      stepTitle="Final steps"
    >
      {stepData &&
        targetAudienceQuestion &&
        styleQuestion &&
        languageQuestion && (
          <>
            <div className={styles.formContainer}>
              {/* Target Audience */}
              <div className={styles.fieldWrapper}>
                <FormInputWrapper
                  label={targetAudienceQuestion?.prompt || 'Target Audience'}
                  labelId="target-audience-label"
                >
                  <Select
                    id="target-audience"
                    items={targetAudienceOptions}
                    labelId="target-audience-label"
                    name="target_audience"
                    onChange={(selected: ResultItem | null) => {
                      if (selected) {
                        setSelectedTargetAudience(String(selected.value));
                      }
                    }}
                    placeholder="Wählen Sie eine Option"
                    value={selectedTargetAudience}
                  />
                </FormInputWrapper>
              </div>

              {/* Conditional Target Audience Detail */}
              {isDetailRequired && (
                <div className={styles.fieldWrapper}>
                  <FormInputWrapper
                    label={
                      targetAudienceDetailQuestion?.prompt ||
                      'Who do you want to address?'
                    }
                    labelId="target-audience-detail-label"
                  >
                    <TextInput
                      id="target-audience-detail"
                      labelId="target-audience-detail-label"
                      name="target_audience_detail"
                      onChange={e => setTargetAudienceDetail(e.target.value)}
                      placeholder="Who do you want to address?"
                      value={targetAudienceDetail}
                    />
                  </FormInputWrapper>
                </div>
              )}

              {/* Style */}
              <div className={styles.fieldWrapper}>
                <FormInputWrapper
                  label={styleQuestion?.prompt || 'Style'}
                  labelId="evp-style-label"
                >
                  <Select
                    id="evp-style"
                    items={styleOptions}
                    labelId="evp-style-label"
                    name="tone_of_voice"
                    onChange={(selected: ResultItem | null) => {
                      if (selected) {
                        setSelectedStyle(String(selected.value));
                      }
                    }}
                    placeholder="Wählen Sie eine Option"
                    value={selectedStyle}
                  />
                </FormInputWrapper>
              </div>

              {/* Language */}
              <div className={styles.fieldWrapper}>
                <FormInputWrapper
                  label={languageQuestion?.prompt || 'Language'}
                  labelId="evp-language-label"
                >
                  <Select
                    id="evp-language"
                    items={languageOptions}
                    labelId="evp-language-label"
                    name="language"
                    onChange={(selected: ResultItem | null) => {
                      if (selected) {
                        setSelectedLanguage(String(selected.value));
                      }
                    }}
                    placeholder="Wählen Sie eine Option"
                    value={selectedLanguage}
                  />
                </FormInputWrapper>
              </div>
            </div>

            {error && <div className={styles.errorMessage}>{error}</div>}

            <NavigationButtons
              canContinue={canContinue && !isSaving}
              onBack={navigateToPreviousStep}
              onContinue={handleContinue}
              showBackButton
            />
          </>
        )}
    </StepContentLayout>
  );
}
