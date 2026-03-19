'use client';

import StepContentLayout from '@/app/components/survey/StepContentLayout';
import useStepNavigation from '../../../hooks/useStepNavigation';
import useSurveyStepState from '../../../hooks/useSurveyStepState';
import NavigationButtons from '@/app/components/survey/NavigationButtons';
import TextSection from '@/app/components/survey/TextSection';
import {buildTextAnswersPayload} from '../../../utils/surveyStepUtils';

import styles from './index.module.scss';

import useEmployerSurveyStep from '@/app/hooks/useEmployerSurveyStep';

interface Step2ContentProps {
  readonly adminToken: string | null;
  readonly projectId: string;
}

export default function Step2Content({
  adminToken,
  projectId,
}: Step2ContentProps) {
  const {error, isLoading, isSaving, saveAnswers, stepData} =
    useEmployerSurveyStep(projectId, 2, adminToken);
  const {setTextAnswer, textAnswers} = useSurveyStepState(stepData);
  const {navigateToNextStep, navigateToPreviousStep} = useStepNavigation(
    projectId,
    2,
    adminToken,
  );

  const questions = stepData?.questions || [];
  const question1 = questions[0];
  const question2 = questions[1];

  const answer1 = textAnswers[question1?.id] || '';
  const answer2 = textAnswers[question2?.id] || '';

  const canContinue = Boolean(answer1.trim() && answer2.trim());

  const handleContinue = async () => {
    if (!adminToken || !stepData) {
      return;
    }

    const answers = buildTextAnswersPayload(questions, textAnswers);
    const saved = await saveAnswers(answers);

    if (saved) navigateToNextStep();
  };

  // Show error if no data loaded
  if (!isLoading && (!stepData || !question1 || !question2)) {
    return (
      <StepContentLayout
        currentStep={2}
        error="Failed to load survey questions"
        isLoading={false}
        stepTitle="What it takes to succeed (Expectations & Requirements)"
      >
        <div />
      </StepContentLayout>
    );
  }

  return (
    <StepContentLayout
      currentStep={2}
      error={error}
      isLoading={isLoading}
      stepTitle="What it takes to succeed (Expectations & Requirements)"
    >
      {stepData && question1 && question2 && (
        <>
          <div className={styles.questionsContainer}>
            <TextSection
              onChange={value => setTextAnswer(question1.id, value)}
              placeholder=""
              title={question1.prompt}
              value={answer1}
            />

            <TextSection
              onChange={value => setTextAnswer(question2.id, value)}
              placeholder=""
              title={question2.prompt}
              value={answer2}
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
