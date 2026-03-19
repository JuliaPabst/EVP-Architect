'use client';

import StepContentLayout from '@/app/components/survey/StepContentLayout';
import NavigationButtons from '@/app/components/survey/NavigationButtons';
import TextSection from '@/app/components/survey/TextSection';
import useStepNavigation from '../../hooks/useStepNavigation';
import useSurveyStepState from '../../hooks/useSurveyStepState';
import {findTextQuestion} from '../../utils/surveyStepUtils';

import styles from './index.module.scss';

import useEmployeeSurveyStep from '@/app/hooks/useEmployeeSurveyStep';

interface TextStepProps {
  readonly projectId: string;
  readonly stepNumber: number;
  readonly stepTitle: string;
}

/**
 * Reusable component for employee survey steps with a single free-text question.
 * Used by Steps 2–5.
 */
export default function TextStep({
  projectId,
  stepNumber,
  stepTitle,
}: TextStepProps) {
  const {error, isLoading, isSaving, saveAnswers, stepData} =
    useEmployeeSurveyStep(projectId, stepNumber);
  const {setTextAnswer, textAnswers} = useSurveyStepState(stepData);
  const {navigateToComplete, navigateToNextStep, navigateToPreviousStep} =
    useStepNavigation(projectId, stepNumber);

  const question = findTextQuestion(stepData?.questions);
  const answer = textAnswers[question?.id ?? ''] || '';
  const isLastStep = stepNumber === 5;
  const canContinue = Boolean(answer.trim());

  const handleContinue = async () => {
    if (!stepData || !question) {
      return;
    }

    const saved = await saveAnswers([
      {
        answer_text: answer,
        question_id: question.id,
      },
    ]);

    if (saved) {
      if (isLastStep) {
        navigateToComplete();
      } else {
        navigateToNextStep();
      }
    }
  };

  if (!isLoading && (!stepData || !question)) {
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
      {stepData && question && (
        <>
          <TextSection
            onChange={value => setTextAnswer(question.id, value)}
            placeholder=""
            title={question.prompt}
            value={answer}
          />

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
