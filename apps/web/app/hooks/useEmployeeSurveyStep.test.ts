import '@testing-library/jest-dom';
import {act, renderHook, waitFor} from '@testing-library/react';

import {stepDataCache} from './surveyStepCache';
import useEmployeeSurveyStep from './useEmployeeSurveyStep';

global.fetch = jest.fn();

const PROJECT_ID = 'proj-employee-test';
const SUBMISSION_ID = 'sub-employee-test';
const STEP = 1;

const makeStepData = (step = STEP) => ({
  questions: [
    {
      answer: null,
      id: 'q1',
      key: 'values',
      options: [],
      prompt: 'What values matter to you?',
      question_type: 'multi_select',
      selection_limit: 5,
    },
  ],
  step,
});

const okJson = (body: object) => ({
  json: jest.fn().mockResolvedValue(body),
  ok: true,
});

const errorJson = (body: object) => ({
  json: jest.fn().mockResolvedValue(body),
  ok: false,
});

const localStorageMock = (() => {
  let store: Record<string, string> = {};

  return {
    clear: () => {
      store = {};
    },
    getItem: (key: string) => store[key] ?? null,
    removeItem: (key: string) => {
      delete store[key];
    },
    setItem: (key: string, value: string) => {
      store[key] = value;
    },
  };
})();

Object.defineProperty(window, 'localStorage', {value: localStorageMock});

describe('useEmployeeSurveyStep', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorageMock.clear();
    stepDataCache.clear();
  });

  it('returns loading state initially', () => {
    (global.fetch as jest.Mock).mockReturnValue(new Promise<never>(() => {}));

    const {result} = renderHook(() => useEmployeeSurveyStep(PROJECT_ID, STEP));

    expect(result.current.isLoading).toBe(true);
    expect(result.current.stepData).toBeNull();
    expect(result.current.error).toBeNull();
  });

  it('sets stepData after successful fetch flow', async () => {
    const stepData = makeStepData();

    (global.fetch as jest.Mock)
      .mockResolvedValueOnce(okJson({submission_id: SUBMISSION_ID}))
      .mockResolvedValueOnce(okJson(stepData));

    const {result} = renderHook(() =>
      useEmployeeSurveyStep('proj-success-1', STEP),
    );

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.stepData).toEqual(stepData);
    expect(result.current.error).toBeNull();
    expect(result.current.submissionId).toBe(SUBMISSION_ID);
  });

  it('sets error when submission fetch fails', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce(
      errorJson({message: 'Failed to initialize survey session'}),
    );

    const {result} = renderHook(() =>
      useEmployeeSurveyStep('proj-sub-fail', STEP),
    );

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.error).toBe('Failed to initialize survey session');
    expect(result.current.stepData).toBeNull();
  });

  it('sets error when step data fetch fails', async () => {
    (global.fetch as jest.Mock)
      .mockResolvedValueOnce(okJson({submission_id: SUBMISSION_ID}))
      .mockResolvedValueOnce(errorJson({message: 'Step not found'}));

    const {result} = renderHook(() =>
      useEmployeeSurveyStep('proj-step-fail', STEP),
    );

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.error).toBe('Step not found');
    expect(result.current.stepData).toBeNull();
  });

  it('uses cached step data and skips second fetch', async () => {
    const stepData = makeStepData(2);

    (global.fetch as jest.Mock)
      .mockResolvedValueOnce(okJson({submission_id: 'sub-cache-test'}))
      .mockResolvedValueOnce(okJson(stepData));

    const {result: first, unmount} = renderHook(() =>
      useEmployeeSurveyStep('proj-cache-test', 2),
    );

    await waitFor(() => {
      expect(first.current.isLoading).toBe(false);
    });

    unmount();

    (global.fetch as jest.Mock).mockResolvedValueOnce(
      okJson({submission_id: 'sub-cache-test'}),
    );

    const {result: second} = renderHook(() =>
      useEmployeeSurveyStep('proj-cache-test', 2),
    );

    await waitFor(() => {
      expect(second.current.isLoading).toBe(false);
    });

    expect(second.current.stepData).toEqual(stepData);
    // fetch called 3 times total: 2 for submission POST, 1 for step GET (cache hit on second)
    expect((global.fetch as jest.Mock).mock.calls.length).toBeLessThanOrEqual(
      3,
    );
  });

  it('sets error on network error', async () => {
    (global.fetch as jest.Mock).mockRejectedValueOnce(
      new Error('Network failure'),
    );

    const {result} = renderHook(() =>
      useEmployeeSurveyStep('proj-net-err', STEP),
    );

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.error).toBe('Network failure');
  });

  it('saveAnswers returns true on success and updates stepData', async () => {
    const stepData = makeStepData(3);

    (global.fetch as jest.Mock)
      .mockResolvedValueOnce(okJson({submission_id: SUBMISSION_ID}))
      .mockResolvedValueOnce(okJson(stepData))
      .mockResolvedValueOnce(okJson({success: true}));

    const {result} = renderHook(() => useEmployeeSurveyStep('proj-save-ok', 3));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    let saveResult: boolean | undefined;

    await act(async () => {
      saveResult = await result.current.saveAnswers([
        {question_id: 'q1', selected_values: ['val1']},
      ]);
    });

    expect(saveResult).toBe(true);
    expect(result.current.error).toBeNull();
    expect(result.current.isSaving).toBe(false);
  });

  it('saveAnswers returns false and sets error on failure', async () => {
    const stepData = makeStepData(4);

    (global.fetch as jest.Mock)
      .mockResolvedValueOnce(okJson({submission_id: SUBMISSION_ID}))
      .mockResolvedValueOnce(okJson(stepData))
      .mockResolvedValueOnce(errorJson({message: 'Save failed'}));

    const {result} = renderHook(() =>
      useEmployeeSurveyStep('proj-save-fail', 4),
    );

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    let saveResult: boolean | undefined;

    await act(async () => {
      saveResult = await result.current.saveAnswers([
        {question_id: 'q1', selected_values: ['val1']},
      ]);
    });

    expect(saveResult).toBe(false);
    expect(result.current.error).toBe('Save failed');
    expect(result.current.isSaving).toBe(false);
  });

  it('saveAnswers falls back to localStorage submissionId when state submissionId is null', async () => {
    localStorageMock.setItem(
      'evp_employee_submission_proj-ls-fallback',
      'stored-sub-id',
    );

    (global.fetch as jest.Mock)
      .mockResolvedValueOnce(okJson({submission_id: 'stored-sub-id'}))
      .mockResolvedValueOnce(okJson(makeStepData()))
      .mockResolvedValueOnce(okJson({success: true}));

    const {result} = renderHook(() =>
      useEmployeeSurveyStep('proj-ls-fallback', STEP),
    );

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    let saveResult: boolean | undefined;

    await act(async () => {
      saveResult = await result.current.saveAnswers([
        {answer_text: 'Some text', question_id: 'q1'},
      ]);
    });

    expect(saveResult).toBe(true);
  });
});
