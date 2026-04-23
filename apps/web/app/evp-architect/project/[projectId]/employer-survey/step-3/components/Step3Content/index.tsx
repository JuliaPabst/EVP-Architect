'use client';

import {buildTextAnswersPayload} from '../../../utils/surveyStepUtils';

import styles from './index.module.scss';

import NavigationButtons from '@/app/components/survey/NavigationButtons';
import StepContentLayout from '@/app/components/survey/StepContentLayout';
import TextSection from '@/app/components/survey/TextSection';
import useStepNavigation from '@/app/hooks/useEmployerStepNavigation';
import useEmployerSurveyStep from '@/app/hooks/useEmployerSurveyStep';
import useSurveyStepState from '@/app/hooks/useSurveyStepState';

interface Step3ContentProps {
  readonly adminToken: string | null;
  readonly projectId: string;
}

export default function Step3Content({
  adminToken,
  projectId,
}: Step3ContentProps) {
  const {error, isLoading, isSaving, saveAnswers, stepData} =
    useEmployerSurveyStep(projectId, 3, adminToken);
  const {setTextAnswer, textAnswers} = useSurveyStepState(stepData);
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

    const answers = buildTextAnswersPayload(questions, textAnswers);
    const saved = await saveAnswers(answers);

    if (saved) navigateToNextStep();
  };

  // Show error if no data loaded
  if (!isLoading && (!stepData || !question)) {
    return (
      <StepContentLayout
        currentStep={3}
        error="Failed to load survey questions"
        isLoading={false}
        stepTitle="Was euch unterscheidet (Positionierung)"
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
      stepTitle="Was euch unterscheidet (Positionierung)"
    >
      {stepData && question && (
        <>
          <div className={styles.questionsContainer}>
            <TextSection
              onChange={value => setTextAnswer(question.id, value)}
              placeholder=""
              title={question.prompt}
              value={answer}
            />
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
