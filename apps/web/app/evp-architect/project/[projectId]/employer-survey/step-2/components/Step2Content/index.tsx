'use client';

import {useEffect, useState} from 'react';

import {useRouter} from 'next/navigation';

import useEmployerSurveyStep from '@/app/hooks/useEmployerSurveyStep';

import {buildStepUrl} from '../../../utils/surveyStepUtils';
import SurveyCardHeader from '../../../components/SurveyCardHeader';
import NavigationButtons from '../../../step-1/components/NavigationButtons';
import TextSection from '../../../step-1/components/TextSection';
import styles from './index.module.scss';

interface Step2ContentProps {
  readonly adminToken: string | null;
  readonly projectId: string;
}

export default function Step2Content({
  adminToken,
  projectId,
}: Step2ContentProps) {
  const router = useRouter();
  const {error, isLoading, isSaving, saveAnswers, stepData} = useEmployerSurveyStep(
    projectId,
    2,
    adminToken,
  );

  const [answer1, setAnswer1] = useState('');
  const [answer2, setAnswer2] = useState('');

  // Get questions from step data
  const question1 = stepData?.questions?.[0];
  const question2 = stepData?.questions?.[1];

  // Initialize answers from existing data when stepData loads
  useEffect(() => {
    if (question1?.answer?.text) {
      setAnswer1(question1.answer.text);
    }
    if (question2?.answer?.text) {
      setAnswer2(question2.answer.text);
    }
  }, [question1, question2]);

  const canContinue = Boolean(answer1?.trim() && answer2?.trim());

  const handleBack = () => {
    router.push(buildStepUrl(projectId, 1, adminToken));
  };

  const handleContinue = async () => {
    if (!adminToken || !stepData) {
      return;
    }

    try {
      const answers = [];
      
      if (question1) {
        answers.push({
          question_id: question1.id,
          answer_text: answer1,
        });
      }
      
      if (question2) {
        answers.push({
          question_id: question2.id,
          answer_text: answer2,
        });
      }

      await saveAnswers(answers);
      
      if (!error) {
        router.push(buildStepUrl(projectId, 3, adminToken));
      }
    } catch (error_) {
      // Error is already set by the hook
    }
  };

  // Show loading state
  if (isLoading) {
    return (
      <div className={styles.step2Content}>
        <div className={styles.container}>
          <div className={styles.loadingMessage}>Loading survey questions...</div>
        </div>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className={styles.step2Content}>
        <div className={styles.container}>
          <div className={styles.errorMessage}>Error: {error}</div>
        </div>
      </div>
    );
  }

  // Show error if no data loaded
  if (!stepData || !question1 || !question2) {
    return (
      <div className={styles.step2Content}>
        <div className={styles.container}>
          <div className={styles.errorMessage}>Failed to load survey questions</div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.step2Content}>
      <div className={styles.container}>
        <SurveyCardHeader
          currentStep={2}
          title="What it takes to succeed (Expectations & Requirements)"
          totalSteps={5}
        />

        <div className={styles.questionsContainer}>
          <TextSection
            onChange={setAnswer1}
            placeholder=""
            title={question1.prompt}
            value={answer1}
          />

          <TextSection
            onChange={setAnswer2}
            placeholder=""
            title={question2.prompt}
            value={answer2}
          />
        </div>

        {error && <div className={styles.errorMessage}>{error}</div>}

        <NavigationButtons
          canContinue={canContinue && !isSaving}
          onContinue={handleContinue}
          onBack={handleBack}
          showBackButton
        />
      </div>
    </div>
  );
}
