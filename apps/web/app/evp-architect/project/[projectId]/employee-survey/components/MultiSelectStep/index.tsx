'use client';

import React from 'react';

import StepContentLayout from '@/app/components/survey/StepContentLayout';
import FocusSelection from '@/app/components/survey/FocusSelection';
import NavigationButtons from '@/app/components/survey/NavigationButtons';
import TextSection from '@/app/components/survey/TextSection';
import useStepNavigation from '../../hooks/useStepNavigation';
import useSurveyStepState from '../../hooks/useSurveyStepState';
import {
  buildAnswersPayload,
  findQuestionByType,
  findTextQuestion,
  transformOptionsForSelection,
} from '../../utils/surveyStepUtils';

import styles from './index.module.scss';

import useEmployeeSurveyStep from '@/app/hooks/useEmployeeSurveyStep';

interface MultiSelectStepProps {
  readonly headerContent?: React.ReactNode;
  readonly onBackNavigation: () => void;
  readonly projectId: string;
  readonly showBackButton?: boolean;
  readonly stepNumber: number;
  readonly stepTitle: string;
}

/**
 * Reusable component for employee survey steps with a multi-select question
 * and an optional follow-up text question (same pattern as employer survey step 1).
 */
export default function MultiSelectStep({
  headerContent,
  onBackNavigation,
  projectId,
  showBackButton = true,
  stepNumber,
  stepTitle,
}: MultiSelectStepProps) {
  const {error, isLoading, isSaving, saveAnswers, stepData} =
    useEmployeeSurveyStep(projectId, stepNumber);
  const {
    additionalContext,
    selectedFactors,
    setAdditionalContext,
    setSelectedFactors,
  } = useSurveyStepState(stepData);
  const {navigateToNextStep} = useStepNavigation(projectId, stepNumber);

  const multiSelectQuestion = findQuestionByType(
    stepData?.questions,
    'multi_select',
  );
  const textQuestion = findTextQuestion(stepData?.questions);

  const focusOptions = transformOptionsForSelection(
    multiSelectQuestion?.options,
  );

  const maxSelections = multiSelectQuestion?.selection_limit || 5;
  const canContinue =
    selectedFactors.length >= 1 && selectedFactors.length <= maxSelections;

  const handleContinue = async () => {
    if (!stepData || !multiSelectQuestion) {
      return;
    }

    const answers = buildAnswersPayload({
      multiSelectQuestion,
      selectedValues: selectedFactors,
      textQuestion,
      textValue: additionalContext,
    });
    const saved = await saveAnswers(answers);

    if (saved) navigateToNextStep();
  };

  if (!isLoading && (!stepData || !multiSelectQuestion)) {
    return (
      <StepContentLayout
        currentStep={stepNumber}
        error="Failed to load survey questions"
        isLoading={false}
        stepTitle={stepTitle}
      >
        <div />
      </StepContentLayout>
    );
  }

  return (
    <StepContentLayout
      currentStep={stepNumber}
      error={error}
      isLoading={isLoading}
      stepTitle={stepTitle}
    >
      {stepData && multiSelectQuestion && (
        <>
          {headerContent}

          <FocusSelection
            initialValue={selectedFactors}
            maxSelections={maxSelections}
            minSelections={1}
            onChange={setSelectedFactors}
            options={focusOptions}
            title={multiSelectQuestion.prompt}
          />

          {textQuestion && (
            <TextSection
              onChange={setAdditionalContext}
              placeholder=""
              title={textQuestion.prompt}
              value={additionalContext}
            />
          )}

          {error && <div className={styles.errorMessage}>{error}</div>}

          <NavigationButtons
            canContinue={canContinue && !isSaving}
            onBack={onBackNavigation}
            onContinue={handleContinue}
            showBackButton={showBackButton}
          />
        </>
      )}
    </StepContentLayout>
  );
}
