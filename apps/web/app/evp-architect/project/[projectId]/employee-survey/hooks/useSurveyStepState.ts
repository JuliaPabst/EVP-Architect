import {useEffect, useState} from 'react';

interface Question {
  readonly id: string;
  readonly key: string;
  readonly prompt: string;
  readonly question_type: string;
  readonly selection_limit: number | null;
  readonly answer?: {
    readonly text?: string;
    readonly values?: readonly string[];
  } | null;
  readonly options?: readonly {
    readonly label: string;
    readonly value_key: string;
  }[];
}

interface StepData {
  readonly questions: readonly Question[];
  readonly step: number;
}

interface UseSurveyStepStateResult {
  readonly additionalContext: string;
  readonly selectedFactors: string[];
  readonly setAdditionalContext: (value: string) => void;
  readonly setSelectedFactors: (values: string[]) => void;
  readonly setTextAnswer: (questionId: string, value: string) => void;
  readonly textAnswers: Record<string, string>;
}

/**
 * Custom hook to manage employee survey step form state with initial values from API
 *
 * @param stepData - The survey step data from API
 * @returns State values and setters for form inputs
 */
export default function useSurveyStepState(
  stepData: StepData | null,
): UseSurveyStepStateResult {
  const [selectedFactors, setSelectedFactors] = useState<string[]>([]);
  const [additionalContext, setAdditionalContext] = useState('');
  const [textAnswers, setTextAnswers] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!stepData) return;

    const newTextAnswers: Record<string, string> = {};

    stepData.questions.forEach(question => {
      if (
        question.question_type === 'multi_select' &&
        question.answer?.values
      ) {
        setSelectedFactors([...question.answer.values]);
      } else if (
        (question.question_type === 'text' ||
          question.question_type === 'long_text') &&
        question.answer?.text
      ) {
        newTextAnswers[question.id] = question.answer.text;
        setAdditionalContext(
          current => current || question.answer?.text || '',
        );
      }
    });

    if (Object.keys(newTextAnswers).length > 0) {
      setTextAnswers(newTextAnswers);
    }
  }, [stepData]);

  const setTextAnswer = (questionId: string, value: string) => {
    setTextAnswers(prev => ({
      ...prev,
      [questionId]: value,
    }));
  };

  return {
    additionalContext,
    selectedFactors,
    setAdditionalContext,
    setSelectedFactors,
    setTextAnswer,
    textAnswers,
  };
}
