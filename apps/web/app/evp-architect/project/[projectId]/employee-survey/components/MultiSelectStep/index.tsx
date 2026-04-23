'use client';

import React from 'react';

import {
  buildAnswersPayload,
  findQuestionByType,
  findTextQuestion,
  transformOptionsForSelection,
} from '../../utils/surveyStepUtils';

import MultiSelectStepLayout from '@/app/components/survey/MultiSelectStepLayout';
import useStepNavigation from '@/app/hooks/useEmployeeStepNavigation';
import useEmployeeSurveyStep from '@/app/hooks/useEmployeeSurveyStep';
import useSurveyStepState from '@/app/hooks/useSurveyStepState';

interface MultiSelectStepProps {
  readonly onBackNavigation: () => void;
  readonly projectId: string;
  readonly stepNumber: number;
  readonly stepTitle: string;
  readonly headerContent?: React.ReactNode;
  readonly showBackButton?: boolean;
}

/**
 * Reusable component for employee survey steps with a multi-select question
 * and an optional follow-up text question.
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
    selectedFactors.length >= 1 &&
    selectedFactors.length <= maxSelections &&
    (!textQuestion || additionalContext.trim().length > 0);

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

  return (
    <MultiSelectStepLayout
      additionalContext={additionalContext}
      canContinue={canContinue}
      error={error}
      focusOptions={focusOptions}
      headerContent={headerContent}
      isLoading={isLoading}
      isSaving={isSaving}
      maxSelections={maxSelections}
      multiSelectQuestion={multiSelectQuestion}
      onBack={onBackNavigation}
      onContinue={handleContinue}
      selectedFactors={selectedFactors}
      setAdditionalContext={setAdditionalContext}
      setSelectedFactors={setSelectedFactors}
      showBackButton={showBackButton}
      stepNumber={stepNumber}
      stepTitle={stepTitle}
      textQuestion={textQuestion}
      totalSteps={5}
    />
  );
}
