'use client';

import React from 'react';

import {
  buildAnswersPayload,
  findQuestionByType,
  findTextQuestion,
  transformOptionsForSelection,
} from '../../utils/surveyStepUtils';

import MultiSelectStepLayout from '@/app/components/survey/MultiSelectStepLayout';
import useStepNavigation from '@/app/hooks/useEmployerStepNavigation';
import useEmployerSurveyStep from '@/app/hooks/useEmployerSurveyStep';
import useSurveyStepState from '@/app/hooks/useSurveyStepState';

interface MultiSelectWithTextStepProps {
  readonly adminToken: string | null;
  readonly onBackNavigation: () => void;
  readonly projectId: string;
  readonly stepNumber: number;
  readonly stepTitle: string;
  readonly headerContent?: React.ReactNode;
  readonly showBackButton?: boolean;
}

/**
 * Common component for employer survey steps that have:
 * - Multi-select question with chips (FocusSelection)
 * - Optional text question (TextSection)
 * - Navigation buttons
 *
 * Used by Step 1 and Step 4 which share the same layout pattern.
 *
 * @param adminToken - Admin authentication token
 * @param headerContent - Optional content to show before FocusSelection (e.g., company card)
 * @param onBackNavigation - Callback for back button click
 * @param projectId - Project ID
 * @param showBackButton - Whether to show the back button (default: true)
 * @param stepNumber - Current step number
 * @param stepTitle - Title to display in the step header
 */
export default function MultiSelectWithTextStep({
  adminToken,
  headerContent,
  onBackNavigation,
  projectId,
  showBackButton = true,
  stepNumber,
  stepTitle,
}: MultiSelectWithTextStepProps) {
  const {error, isLoading, isSaving, saveAnswers, stepData} =
    useEmployerSurveyStep(projectId, stepNumber, adminToken);
  const {
    additionalContext,
    selectedFactors,
    setAdditionalContext,
    setSelectedFactors,
  } = useSurveyStepState(stepData);
  const {navigateToNextStep} = useStepNavigation(
    projectId,
    stepNumber,
    adminToken,
  );

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
    if (!adminToken || !stepData) {
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
    />
  );
}
