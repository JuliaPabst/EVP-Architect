'use client';

import useAdminTokenValidation from '@/app/hooks/useAdminTokenValidation';
import useEmployerSurveyStep from '@/app/hooks/useEmployerSurveyStep';

import useSurveyStepState from '../../../hooks/useSurveyStepState';
import useStepNavigation from '../../../hooks/useStepNavigation';
import {
  buildAnswersPayload,
  findQuestionByType,
  findTextQuestion,
  transformOptionsForSelection,
} from '../../../utils/surveyStepUtils';
import StepContentLayout from '../../../components/StepContentLayout';
import FocusSelection from '../FocusSelection';
import NavigationButtons from '../NavigationButtons';
import SelectedCompany from '../SelectedCompany';
import TextSection from '../TextSection';
import styles from './index.module.scss';

interface Step1ContentProps {
  readonly adminToken: string | null;
  readonly projectId: string;
}

export default function Step1Content({
  adminToken,
  projectId,
}: Step1ContentProps) {
  const {project} = useAdminTokenValidation(projectId, adminToken);
  const {error, isLoading, isSaving, saveAnswers, stepData} = useEmployerSurveyStep(
    projectId,
    1,
    adminToken,
  );
  const {additionalContext, selectedFactors, setAdditionalContext, setSelectedFactors} =
    useSurveyStepState(stepData);
  const {navigateToNextStep, navigateToProject} = useStepNavigation(
    projectId,
    1,
    adminToken,
  );

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
        currentStep={1}
        error="Failed to load survey questions"
        isLoading={false}
        stepTitle="Who you are today (Culture & Values)?"
      >
        <div />
      </StepContentLayout>
    );
  }

  return (
    <StepContentLayout
      currentStep={1}
      error={error}
      isLoading={isLoading}
      stepTitle="Who you are today (Culture & Values)?"
    >
      {stepData && multiSelectQuestion && (
        <>
          <SelectedCompany
            companyName={project?.company_name || ''}
            industry={project?.industry_name}
            location={project?.location}
            logoUrl={project?.profile_image_url}
          />

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
            onContinue={handleContinue}
            onBack={navigateToProject}
          />
        </>
      )}
    </StepContentLayout>
  );
}
