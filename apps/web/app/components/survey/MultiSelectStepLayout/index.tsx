'use client';

import React from 'react';

import styles from './index.module.scss';

import FocusSelection from '@/app/components/survey/FocusSelection';
import NavigationButtons from '@/app/components/survey/NavigationButtons';
import StepContentLayout from '@/app/components/survey/StepContentLayout';
import TextSection from '@/app/components/survey/TextSection';

interface MultiSelectQuestion {
  readonly id: string;
  readonly prompt: string;
  readonly selection_limit: number | null;
  readonly options?: readonly {readonly id: string; readonly label: string}[];
}

interface TextQuestion {
  readonly prompt: string;
}

export interface MultiSelectStepLayoutProps {
  readonly additionalContext: string;
  readonly canContinue: boolean;
  readonly error: string | null;
  readonly focusOptions: readonly {
    readonly id: string;
    readonly label: string;
  }[];
  readonly isLoading: boolean;
  readonly isSaving: boolean;
  readonly maxSelections: number;
  readonly multiSelectQuestion: MultiSelectQuestion | undefined;
  readonly onBack: () => void;
  readonly onContinue: () => void;
  readonly selectedFactors: readonly string[];
  readonly setAdditionalContext: (value: string) => void;
  readonly setSelectedFactors: (value: string[]) => void;
  readonly stepNumber: number;
  readonly stepTitle: string;
  readonly textQuestion: TextQuestion | undefined;
  readonly headerContent?: React.ReactNode;
  readonly showBackButton?: boolean;
}

/**
 * Shared presentational component for survey steps with a multi-select question
 * and an optional follow-up text question.
 *
 * Used by both employee and employer survey MultiSelectStep components.
 */
export default function MultiSelectStepLayout({
  additionalContext,
  canContinue,
  error,
  focusOptions,
  headerContent,
  isLoading,
  isSaving,
  maxSelections,
  multiSelectQuestion,
  onBack,
  onContinue,
  selectedFactors,
  setAdditionalContext,
  setSelectedFactors,
  showBackButton = true,
  stepNumber,
  stepTitle,
  textQuestion,
}: MultiSelectStepLayoutProps) {
  if (!isLoading && !multiSelectQuestion) {
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
      {multiSelectQuestion && (
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
            onBack={onBack}
            onContinue={onContinue}
            showBackButton={showBackButton}
          />
        </>
      )}
    </StepContentLayout>
  );
}
