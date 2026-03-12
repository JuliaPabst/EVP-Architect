'use client';

import React from 'react';

import useEmployerSurveyStep from '@/app/hooks/useEmployerSurveyStep';

import useSurveyStepState from '../../hooks/useSurveyStepState';
import useStepNavigation from '../../hooks/useStepNavigation';
import {
  buildAnswersPayload,
  findQuestionByType,
  findTextQuestion,
  transformOptionsForSelection,
} from '../../utils/surveyStepUtils';
import StepContentLayout from '../StepContentLayout';
import FocusSelection from '../../step-1/components/FocusSelection';
import NavigationButtons from '../../step-1/components/NavigationButtons';
import TextSection from '../../step-1/components/TextSection';
import styles from './index.module.scss';

interface MultiSelectWithTextStepProps {
  readonly adminToken: string | null;
  readonly headerContent?: React.ReactNode;
  readonly onBackNavigation: () => void;
  readonly projectId: string;
  readonly showBackButton?: boolean;
  readonly stepNumber: number;
  readonly stepTitle: string;
}

/**
 * Common component for survey steps that have:
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
  const {error, isLoading, isSaving, saveAnswers, stepData} = useEmployerSurveyStep(
    projectId,
    stepNumber,
    adminToken,
  );
  const {additionalContext, selectedFactors, setAdditionalContext, setSelectedFactors} =
    useSurveyStepState(stepData);
  const {navigateToNextStep} = useStepNavigation(projectId, stepNumber, adminToken);

  // Find the relevant questions from fetched data
  const multiSelectQuestion = findQuestionByType(stepData?.questions, 'multi_select');
  const textQuestion = findTextQuestion(stepData?.questions);

  // Transform options for FocusSelection component
  const focusOptions = transformOptionsForSelection(multiSelectQuestion?.options);

  const maxSelections = multiSelectQuestion?.selection_limit || 5;
  const canContinue = selectedFactors.length >= 1 && selectedFactors.length <= maxSelections;

  const handleContinue = async () => {
    if (!adminToken || !stepData) {
      return;
    }

    try {
      const answers = buildAnswersPayload({
        multiSelectQuestion,
        selectedValues: selectedFactors,
        textQuestion,
        textValue: additionalContext,
      });

      await saveAnswers(answers);

      if (!error) {
        navigateToNextStep();
      }
    } catch (error_) {
      // Error is already set by the hook
    }
  };

  // Show error if no data loaded
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
