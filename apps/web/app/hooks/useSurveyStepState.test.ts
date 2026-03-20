import '@testing-library/jest-dom';
import {act, renderHook} from '@testing-library/react';

import useSurveyStepState from './useSurveyStepState';

const makeQuestion = (overrides: object = {}) => ({
  answer: null,
  id: 'q1',
  key: 'test_key',
  options: [],
  prompt: 'Test prompt',
  question_type: 'text',
  selection_limit: null,
  ...overrides,
});

const makeStepData = (questions: object[]) => ({
  questions,
  step: 1,
});

describe('useSurveyStepState', () => {
  it('returns initial empty state when stepData is null', () => {
    const {result} = renderHook(() => useSurveyStepState(null));

    expect(result.current.additionalContext).toBe('');
    expect(result.current.selectedFactors).toEqual([]);
    expect(result.current.textAnswers).toEqual({});
  });

  it('populates selectedFactors from multi_select question answer', () => {
    const stepData = makeStepData([
      makeQuestion({
        answer: {values: ['factor_a', 'factor_b']},
        id: 'q1',
        question_type: 'multi_select',
      }),
    ]);

    const {result} = renderHook(() => useSurveyStepState(stepData));

    expect(result.current.selectedFactors).toEqual(['factor_a', 'factor_b']);
  });

  it('populates textAnswers from text question answer', () => {
    const stepData = makeStepData([
      makeQuestion({
        answer: {text: 'My text answer'},
        id: 'q2',
        question_type: 'text',
      }),
    ]);

    const {result} = renderHook(() => useSurveyStepState(stepData));

    expect(result.current.textAnswers).toEqual({q2: 'My text answer'});
  });

  it('sets additionalContext from the first text answer', () => {
    const stepData = makeStepData([
      makeQuestion({
        answer: {text: 'Context value'},
        id: 'q3',
        question_type: 'long_text',
      }),
    ]);

    const {result} = renderHook(() => useSurveyStepState(stepData));

    expect(result.current.additionalContext).toBe('Context value');
  });

  it('setTextAnswer updates textAnswers for the given questionId', () => {
    const {result} = renderHook(() => useSurveyStepState(null));

    act(() => {
      result.current.setTextAnswer('q5', 'Updated answer');
    });

    expect(result.current.textAnswers).toEqual({q5: 'Updated answer'});
  });

  it('setSelectedFactors updates selectedFactors', () => {
    const {result} = renderHook(() => useSurveyStepState(null));

    act(() => {
      result.current.setSelectedFactors(['x', 'y', 'z']);
    });

    expect(result.current.selectedFactors).toEqual(['x', 'y', 'z']);
  });

  it('setAdditionalContext updates additionalContext', () => {
    const {result} = renderHook(() => useSurveyStepState(null));

    act(() => {
      result.current.setAdditionalContext('New context');
    });

    expect(result.current.additionalContext).toBe('New context');
  });
});
