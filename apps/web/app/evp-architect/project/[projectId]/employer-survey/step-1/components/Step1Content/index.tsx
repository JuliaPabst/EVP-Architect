'use client';

import {useRouter} from 'next/navigation';

import useAdminTokenValidation from '@/app/hooks/useAdminTokenValidation';
import useEmployerSurveyStep from '@/app/hooks/useEmployerSurveyStep';

import useSurveyStepState from '../../../hooks/useSurveyStepState';
import {
  buildAnswersPayload,
  buildProjectUrl,
  buildStepUrl,
  findQuestionByType,
  findTextQuestion,
  transformOptionsForSelection,
} from '../../../utils/surveyStepUtils';
import FocusSelection from '../FocusSelection';
import NavigationButtons from '../NavigationButtons';
import ProgressHeader from '../ProgressHeader';
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
  const router = useRouter();
  const {project} = useAdminTokenValidation(projectId, adminToken);
  const {error, isLoading, isSaving, saveAnswers, stepData} = useEmployerSurveyStep(
    projectId,
    1,
    adminToken,
  );
  const {additionalContext, selectedFactors, setAdditionalContext, setSelectedFactors} =
    useSurveyStepState(stepData);

  // Find the relevant questions from fetched data
  const multiSelectQuestion = findQuestionByType(stepData?.questions, 'multi_select');
  const textQuestion = findTextQuestion(stepData?.questions);

  // Transform options for FocusSelection component
  const focusOptions = transformOptionsForSelection(multiSelectQuestion?.options);

  const maxSelections = multiSelectQuestion?.selection_limit || 5;
  const canContinue = selectedFactors.length >= 1 && selectedFactors.length <= maxSelections;

  const handleBack = () => {
    router.push(buildProjectUrl(projectId));
  };

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

      router.push(buildStepUrl(projectId, 2, adminToken));
    } catch (error_) {
      // Error is already set by the hook
    }
  };

  // Show loading state
  if (isLoading) {
    return (
      <div className={styles.step1Content}>
        <div className={styles.container}>
          <div className={styles.loadingMessage}>Loading survey questions...</div>
        </div>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className={styles.step1Content}>
        <div className={styles.container}>
          <div className={styles.errorMessage}>Error: {error}</div>
        </div>
      </div>
    );
  }

  // Show error if no data loaded
  if (!stepData || !multiSelectQuestion) {
    return (
      <div className={styles.step1Content}>
        <div className={styles.container}>
          <div className={styles.errorMessage}>Failed to load survey questions</div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.step1Content}>
      <div className={styles.container}>
        <ProgressHeader
          currentStep={1}
          onBack={handleBack}
          title="Who you are today (Culture & Values)?"
          totalSteps={5}
        />

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
        />
      </div>
    </div>
  );
}
