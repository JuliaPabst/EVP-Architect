import {useEffect, useState} from 'react';

interface Question {
  readonly id: string;
  readonly key: string;
  readonly prompt: string;
  readonly question_type: string;
  readonly selection_limit: number | null;
  readonly options?: readonly {
    readonly value_key: string;
    readonly label: string;
  }[];
  readonly answer?: {
    readonly text?: string;
    readonly values?: readonly string[];
  } | null;
}

interface StepData {
  readonly step: number;
  readonly questions: readonly Question[];
}

interface UseSurveyStepStateResult {
  readonly additionalContext: string;
  readonly selectedFactors: string[];
  readonly setAdditionalContext: (value: string) => void;
  readonly setSelectedFactors: (values: string[]) => void;
  readonly textAnswers: Record<string, string>;
  readonly setTextAnswer: (questionId: string, value: string) => void;
}

/**
 * Custom hook to manage survey step form state with initial values from API
 *
 * Automatically populates state when stepData is loaded with existing answers.
 * Provides state management for multi-select and text inputs.
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

  // Set initial values from existing answers when stepData loads
  useEffect(() => {
    if (!stepData) return;

    const newTextAnswers: Record<string, string> = {};

    stepData.questions.forEach((question) => {
      if (question.question_type === 'multi_select' && question.answer?.values) {
        setSelectedFactors([...question.answer.values]);
      } else if (
        (question.question_type === 'text' || question.question_type === 'long_text') &&
        question.answer?.text
      ) {
        newTextAnswers[question.id] = question.answer.text;
        // For backward compatibility, set the first text answer as additionalContext
        if (!additionalContext) {
          setAdditionalContext(question.answer.text);
        }
      }
    });

    if (Object.keys(newTextAnswers).length > 0) {
      setTextAnswers(newTextAnswers);
    }
  }, [stepData]);

  const setTextAnswer = (questionId: string, value: string) => {
    setTextAnswers((prev) => ({
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

