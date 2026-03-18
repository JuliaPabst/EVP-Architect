import '@testing-library/jest-dom';
import {act, renderHook, waitFor} from '@testing-library/react';

import useEmployerSurveyStep from './useEmployerSurveyStep';

// Mock fetch globally
global.fetch = jest.fn();

// Module-level cache maps are not exported, so we clear mocks between tests
// and rely on unique projectId/step combos to avoid cross-test cache hits.

const PROJECT_ID = 'proj-abc';
const ADMIN_TOKEN = 'tok-123';
const STEP = 1;

const makeStepData = (step = STEP) => ({
  questions: [
    {
      answer: null,
      id: 'q1',
      key: 'culture',
      options: [],
      prompt: 'Describe your culture',
      question_type: 'multi_select',
      selection_limit: 5,
    },
  ],
  step,
});

const okResponse = (body: object) => ({
  json: jest.fn().mockResolvedValue(body),
  ok: true,
});

const errorResponse = (body: object, status = 400) => ({
  json: jest.fn().mockResolvedValue(body),
  ok: false,
  status,
});

describe('useEmployerSurveyStep', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns loading state initially', () => {
    (global.fetch as jest.Mock).mockReturnValue(new Promise<never>(() => {}));

    const {result} = renderHook(() =>
      useEmployerSurveyStep(PROJECT_ID, STEP, ADMIN_TOKEN),
    );

    expect(result.current.isLoading).toBe(true);
    expect(result.current.stepData).toBeNull();
    expect(result.current.error).toBeNull();
  });

  it('sets stepData on successful fetch', async () => {
    const stepData = makeStepData();

    (global.fetch as jest.Mock).mockResolvedValueOnce(okResponse(stepData));

    const {result} = renderHook(() =>
      useEmployerSurveyStep('proj-success', STEP, ADMIN_TOKEN),
    );

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.stepData).toEqual(stepData);
    expect(result.current.error).toBeNull();
  });

  it('sets error when no adminToken', async () => {
    const {result} = renderHook(() =>
      useEmployerSurveyStep(PROJECT_ID, STEP, null),
    );

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.error).toBe('Authentication token is missing');
    expect(result.current.stepData).toBeNull();
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('sets error on failed fetch (non-ok response)', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce(
      errorResponse({message: 'Not found'}, 404),
    );

    const {result} = renderHook(() =>
      useEmployerSurveyStep('proj-fail', STEP, ADMIN_TOKEN),
    );

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.error).toBe('Not found');
    expect(result.current.stepData).toBeNull();
  });

  it('sets error on network error', async () => {
    (global.fetch as jest.Mock).mockRejectedValueOnce(
      new Error('Network failure'),
    );

    const {result} = renderHook(() =>
      useEmployerSurveyStep('proj-network-err', STEP, ADMIN_TOKEN),
    );

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.error).toBe('Network failure');
    expect(result.current.stepData).toBeNull();
  });

  it('uses cached data on second render with the same key', async () => {
    const stepData = makeStepData(2);

    (global.fetch as jest.Mock).mockResolvedValueOnce(okResponse(stepData));

    // First render — populates cache
    const {result: first, unmount} = renderHook(() =>
      useEmployerSurveyStep('proj-cache', 2, ADMIN_TOKEN),
    );

    await waitFor(() => {
      expect(first.current.isLoading).toBe(false);
    });

    expect(first.current.stepData).toEqual(stepData);
    unmount();

    // Second render — should use cache, fetch should NOT be called again
    const {result: second} = renderHook(() =>
      useEmployerSurveyStep('proj-cache', 2, ADMIN_TOKEN),
    );

    await waitFor(() => {
      expect(second.current.isLoading).toBe(false);
    });

    expect(second.current.stepData).toEqual(stepData);
    expect(global.fetch).toHaveBeenCalledTimes(1);
  });

  it('saveAnswers returns true on success', async () => {
    const stepData = makeStepData(3);

    (global.fetch as jest.Mock)
      .mockResolvedValueOnce(okResponse(stepData)) // initial fetch
      .mockResolvedValueOnce(okResponse({success: true})); // saveAnswers POST

    const {result} = renderHook(() =>
      useEmployerSurveyStep('proj-save-ok', 3, ADMIN_TOKEN),
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

    expect(saveResult).toBe(true);
    expect(result.current.error).toBeNull();
    expect(result.current.isSaving).toBe(false);
  });

  it('saveAnswers returns false and sets error on failure', async () => {
    const stepData = makeStepData(4);

    (global.fetch as jest.Mock)
      .mockResolvedValueOnce(okResponse(stepData)) // initial fetch
      .mockResolvedValueOnce(errorResponse({message: 'Save failed'}, 500)); // saveAnswers POST

    const {result} = renderHook(() =>
      useEmployerSurveyStep('proj-save-fail', 4, ADMIN_TOKEN),
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

  it('saveAnswers returns false when no adminToken', async () => {
    const {result} = renderHook(() =>
      useEmployerSurveyStep('proj-save-notoken', STEP, null),
    );

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    // Clear the initial error so we can confirm saveAnswers sets it too
    let saveResult: boolean | undefined;

    await act(async () => {
      saveResult = await result.current.saveAnswers([
        {question_id: 'q1', selected_values: ['val1']},
      ]);
    });

    expect(saveResult).toBe(false);
    expect(result.current.error).toBe('Authentication token is missing');
    expect(global.fetch).not.toHaveBeenCalled();
  });
});
