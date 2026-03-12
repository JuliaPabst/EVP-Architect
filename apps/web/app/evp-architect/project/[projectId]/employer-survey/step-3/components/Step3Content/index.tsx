'use client';

import useEmployerSurveyStep from '@/app/hooks/useEmployerSurveyStep';

import useSurveyStepState from '../../../hooks/useSurveyStepState';
import useStepNavigation from '../../../hooks/useStepNavigation';
import {buildTextAnswersPayload} from '../../../utils/surveyStepUtils';
import StepContentLayout from '../../../components/StepContentLayout';
import NavigationButtons from '../../../step-1/components/NavigationButtons';
import TextSection from '../../../step-1/components/TextSection';
import styles from './index.module.scss';

interface Step3ContentProps {
  readonly adminToken: string | null;
  readonly projectId: string;
}

export default function Step3Content({
  adminToken,
  projectId,
}: Step3ContentProps) {
  const {error, isLoading, isSaving, saveAnswers, stepData} = useEmployerSurveyStep(
    projectId,
    3,
    adminToken,
  );
  const {textAnswers, setTextAnswer} = useSurveyStepState(stepData);
  const {navigateToNextStep, navigateToPreviousStep} = useStepNavigation(
    projectId,
    3,
    adminToken,
  );

  const questions = stepData?.questions || [];
  const question = questions[0];
  const answer = textAnswers[question?.id] || '';

  const canContinue = Boolean(answer.trim());

  const handleContinue = async () => {
    if (!adminToken || !stepData) {
      return;
    }

    try {
      const answers = buildTextAnswersPayload(questions, textAnswers);
      await saveAnswers(answers);
      
      if (!error) {
        navigateToNextStep();
      }
    } catch (error_) {
      // Error is already set by the hook
    }
  };

  // Show error if no data loaded
  if (!isLoading && (!stepData || !question)) {
    return (
      <StepContentLayout
        currentStep={3}
        error="Failed to load survey questions"
        isLoading={false}
        stepTitle="What makes you different (Positioning)"
      >
        <div />
      </StepContentLayout>
    );
  }

  return (
    <StepContentLayout
      currentStep={3}
      error={error}
      isLoading={isLoading}
      stepTitle="What makes you different (Positioning)"
    >
      {stepData && question && (
        <>
          <div className={styles.questionsContainer}>
            <TextSection
              onChange={(value) => setTextAnswer(question.id, value)}
              placeholder=""
              title={question.prompt}
              value={answer}
            />
          </div>

          {error && <div className={styles.errorMessage}>{error}</div>}

          <NavigationButtons
            canContinue={canContinue && !isSaving}
            onContinue={handleContinue}
            onBack={navigateToPreviousStep}
            showBackButton
          />
        </>
      )}
    </StepContentLayout>
  );
}
