import {
  buildAnswersPayload,
  buildCompleteUrl,
  buildMultiSelectAnswerPayload,
  buildStepUrl,
  buildTextAnswerPayload,
  extractMultiSelectValues,
  extractTextValue,
  findQuestionByType,
  findTextQuestion,
  transformOptionsForSelection,
} from './surveyStepUtils';

const makeQuestion = (overrides = {}) => ({
  answer: null,
  id: 'q1',
  key: 'test_question',
  options: undefined,
  prompt: 'Test prompt',
  question_type: 'text',
  selection_limit: null,
  ...overrides,
});

describe('findQuestionByType', () => {
  it('finds a question matching the given type', () => {
    const questions = [
      makeQuestion({id: 'q1', question_type: 'text'}),
      makeQuestion({id: 'q2', question_type: 'multi_select'}),
    ];

    expect(findQuestionByType(questions, 'multi_select')?.id).toBe('q2');
  });

  it('returns the first match when multiple questions share the same type', () => {
    const questions = [
      makeQuestion({id: 'q1', question_type: 'text'}),
      makeQuestion({id: 'q2', question_type: 'text'}),
    ];

    expect(findQuestionByType(questions, 'text')?.id).toBe('q1');
  });

  it('returns undefined when no question matches the type', () => {
    const questions = [makeQuestion({question_type: 'text'})];

    expect(findQuestionByType(questions, 'multi_select')).toBeUndefined();
  });

  it('returns undefined when questions is undefined', () => {
    expect(findQuestionByType(undefined, 'text')).toBeUndefined();
  });

  it('returns undefined for an empty questions array', () => {
    expect(findQuestionByType([], 'text')).toBeUndefined();
  });
});

describe('findTextQuestion', () => {
  it('finds a question with type "text"', () => {
    const questions = [
      makeQuestion({id: 'q1', question_type: 'multi_select'}),
      makeQuestion({id: 'q2', question_type: 'text'}),
    ];

    expect(findTextQuestion(questions)?.id).toBe('q2');
  });

  it('finds a question with type "long_text"', () => {
    const questions = [makeQuestion({id: 'q3', question_type: 'long_text'})];

    expect(findTextQuestion(questions)?.id).toBe('q3');
  });

  it('returns undefined when no text question is found', () => {
    const questions = [makeQuestion({question_type: 'multi_select'})];

    expect(findTextQuestion(questions)).toBeUndefined();
  });

  it('returns undefined when questions is undefined', () => {
    expect(findTextQuestion(undefined)).toBeUndefined();
  });

  it('returns undefined for an empty questions array', () => {
    expect(findTextQuestion([])).toBeUndefined();
  });
});

describe('transformOptionsForSelection', () => {
  it('transforms options to {id, label} format', () => {
    const options = [
      {label: 'Label A', value_key: 'key_a'},
      {label: 'Label B', value_key: 'key_b'},
    ];

    expect(transformOptionsForSelection(options)).toEqual([
      {id: 'key_a', label: 'Label A'},
      {id: 'key_b', label: 'Label B'},
    ]);
  });

  it('returns an empty array for undefined input', () => {
    expect(transformOptionsForSelection(undefined)).toEqual([]);
  });

  it('returns an empty array for an empty options array', () => {
    expect(transformOptionsForSelection([])).toEqual([]);
  });
});

describe('extractMultiSelectValues', () => {
  it('extracts values from a question answer', () => {
    const question = makeQuestion({answer: {values: ['a', 'b', 'c']}});

    expect(extractMultiSelectValues(question)).toEqual(['a', 'b', 'c']);
  });

  it('returns an empty array when question is undefined', () => {
    expect(extractMultiSelectValues(undefined)).toEqual([]);
  });

  it('returns an empty array when answer is null', () => {
    const question = makeQuestion({answer: null});

    expect(extractMultiSelectValues(question)).toEqual([]);
  });

  it('returns an empty array when answer has no values field', () => {
    const question = makeQuestion({answer: {text: 'some text'}});

    expect(extractMultiSelectValues(question)).toEqual([]);
  });

  it('returns a copy so mutations do not affect the original', () => {
    const values = ['x', 'y'];
    const question = makeQuestion({answer: {values}});
    const result = extractMultiSelectValues(question);

    result.push('z');

    expect(values).toHaveLength(2);
  });
});

describe('extractTextValue', () => {
  it('extracts text from a question answer', () => {
    const question = makeQuestion({answer: {text: 'My answer'}});

    expect(extractTextValue(question)).toBe('My answer');
  });

  it('returns an empty string when question is undefined', () => {
    expect(extractTextValue(undefined)).toBe('');
  });

  it('returns an empty string when answer is null', () => {
    const question = makeQuestion({answer: null});

    expect(extractTextValue(question)).toBe('');
  });

  it('returns an empty string when answer has no text field', () => {
    const question = makeQuestion({answer: {values: ['a']}});

    expect(extractTextValue(question)).toBe('');
  });
});

describe('buildAnswersPayload', () => {
  it('builds payload with both multi-select and text answers', () => {
    const multiSelectQuestion = makeQuestion({
      id: 'q1',
      question_type: 'multi_select',
    });
    const textQuestion = makeQuestion({id: 'q2', question_type: 'text'});

    const result = buildAnswersPayload({
      multiSelectQuestion,
      selectedValues: ['val1', 'val2'],
      textQuestion,
      textValue: 'My text',
    });

    expect(result).toHaveLength(2);
    expect(result[0]).toEqual({
      question_id: 'q1',
      selected_values: ['val1', 'val2'],
    });
    expect(result[1]).toEqual({answer_text: 'My text', question_id: 'q2'});
  });

  it('skips multi-select when selectedValues is empty', () => {
    const result = buildAnswersPayload({
      multiSelectQuestion: makeQuestion({id: 'q1'}),
      selectedValues: [],
      textQuestion: makeQuestion({id: 'q2'}),
      textValue: 'Answer',
    });

    expect(result).toHaveLength(1);
    expect(result[0].question_id).toBe('q2');
  });

  it('skips text answer when textValue is only whitespace', () => {
    const result = buildAnswersPayload({
      multiSelectQuestion: makeQuestion({id: 'q1'}),
      selectedValues: ['val1'],
      textQuestion: makeQuestion({id: 'q2'}),
      textValue: '   ',
    });

    expect(result).toHaveLength(1);
    expect(result[0].question_id).toBe('q1');
  });

  it('returns an empty array when no params provided', () => {
    expect(buildAnswersPayload({})).toEqual([]);
  });

  it('returns an empty array when selectedValues is undefined and textValue is empty', () => {
    const result = buildAnswersPayload({
      multiSelectQuestion: makeQuestion({id: 'q1'}),
      selectedValues: undefined,
      textQuestion: makeQuestion({id: 'q2'}),
      textValue: '',
    });

    expect(result).toEqual([]);
  });
});

describe('buildMultiSelectAnswerPayload', () => {
  it('returns a payload with question_id and selected_values', () => {
    const question = makeQuestion({id: 'ms-q1', question_type: 'multi_select'});

    const result = buildMultiSelectAnswerPayload({
      multiSelectQuestion: question,
      selectedValues: ['v1', 'v2'],
    });

    expect(result).toEqual([
      {question_id: 'ms-q1', selected_values: ['v1', 'v2']},
    ]);
  });

  it('returns an empty array when selectedValues is empty', () => {
    const question = makeQuestion({id: 'ms-q1', question_type: 'multi_select'});

    const result = buildMultiSelectAnswerPayload({
      multiSelectQuestion: question,
      selectedValues: [],
    });

    expect(result).toEqual([]);
  });
});

describe('buildTextAnswerPayload', () => {
  it('returns a payload with answer_text and question_id', () => {
    const question = makeQuestion({id: 'txt-q1'});

    const result = buildTextAnswerPayload(question, 'My response');

    expect(result).toEqual([
      {answer_text: 'My response', question_id: 'txt-q1'},
    ]);
  });

  it('returns an empty array when textValue is empty', () => {
    const question = makeQuestion({id: 'txt-q1'});

    expect(buildTextAnswerPayload(question, '')).toEqual([]);
  });

  it('returns an empty array when textValue is only whitespace', () => {
    const question = makeQuestion({id: 'txt-q1'});

    expect(buildTextAnswerPayload(question, '   ')).toEqual([]);
  });
});

describe('buildStepUrl', () => {
  it('builds the correct step URL', () => {
    expect(buildStepUrl('proj-123', 1)).toBe(
      '/evp-architect/project/proj-123/employee-survey/step-1',
    );
  });

  it('builds URL for step 5', () => {
    expect(buildStepUrl('abc', 5)).toBe(
      '/evp-architect/project/abc/employee-survey/step-5',
    );
  });
});

describe('buildCompleteUrl', () => {
  it('builds the correct completion page URL', () => {
    expect(buildCompleteUrl('proj-456')).toBe(
      '/evp-architect/project/proj-456/employee-survey/complete',
    );
  });
});
