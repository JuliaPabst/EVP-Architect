import {
  findQuestionByType,
  findTextQuestion,
  transformOptionsForSelection,
  extractMultiSelectValues,
  extractTextValue,
  buildAnswersPayload,
  buildTextAnswersPayload,
  buildStepUrl,
  buildProjectUrl,
} from './surveyStepUtils';

const makeQuestion = (overrides = {}) => ({
  id: 'q1',
  key: 'test_question',
  prompt: 'Test prompt',
  question_type: 'text',
  selection_limit: null,
  ...overrides,
});

describe('findQuestionByType', () => {
  it('should find a question by type', () => {
    const questions = [
      makeQuestion({id: 'q1', question_type: 'text'}),
      makeQuestion({id: 'q2', question_type: 'multi_select'}),
    ];

    expect(findQuestionByType(questions, 'multi_select')?.id).toBe('q2');
  });

  it('should return undefined when type not found', () => {
    const questions = [makeQuestion({question_type: 'text'})];

    expect(findQuestionByType(questions, 'nonexistent')).toBeUndefined();
  });

  it('should return undefined when questions is undefined', () => {
    expect(findQuestionByType(undefined, 'text')).toBeUndefined();
  });

  it('should return undefined for empty array', () => {
    expect(findQuestionByType([], 'text')).toBeUndefined();
  });
});

describe('findTextQuestion', () => {
  it('should find a question with type "text"', () => {
    const questions = [
      makeQuestion({id: 'q1', question_type: 'multi_select'}),
      makeQuestion({id: 'q2', question_type: 'text'}),
    ];

    expect(findTextQuestion(questions)?.id).toBe('q2');
  });

  it('should find a question with type "long_text"', () => {
    const questions = [makeQuestion({id: 'q3', question_type: 'long_text'})];

    expect(findTextQuestion(questions)?.id).toBe('q3');
  });

  it('should return undefined when no text question found', () => {
    const questions = [makeQuestion({question_type: 'multi_select'})];

    expect(findTextQuestion(questions)).toBeUndefined();
  });

  it('should return undefined when questions is undefined', () => {
    expect(findTextQuestion(undefined)).toBeUndefined();
  });
});

describe('transformOptionsForSelection', () => {
  it('should transform options to FocusOption format', () => {
    const options = [
      {label: 'Label A', value_key: 'key_a'},
      {label: 'Label B', value_key: 'key_b'},
    ];

    expect(transformOptionsForSelection(options)).toEqual([
      {id: 'key_a', label: 'Label A'},
      {id: 'key_b', label: 'Label B'},
    ]);
  });

  it('should return empty array for undefined options', () => {
    expect(transformOptionsForSelection(undefined)).toEqual([]);
  });

  it('should return empty array for empty options', () => {
    expect(transformOptionsForSelection([])).toEqual([]);
  });
});

describe('extractMultiSelectValues', () => {
  it('should extract values from question answer', () => {
    const question = makeQuestion({answer: {values: ['a', 'b', 'c']}});

    expect(extractMultiSelectValues(question)).toEqual(['a', 'b', 'c']);
  });

  it('should return empty array when question is undefined', () => {
    expect(extractMultiSelectValues(undefined)).toEqual([]);
  });

  it('should return empty array when answer is null', () => {
    const question = makeQuestion({answer: null});

    expect(extractMultiSelectValues(question)).toEqual([]);
  });

  it('should return empty array when answer has no values', () => {
    const question = makeQuestion({answer: {text: 'some text'}});

    expect(extractMultiSelectValues(question)).toEqual([]);
  });

  it('should return a copy of the values array', () => {
    const values = ['x', 'y'];
    const question = makeQuestion({answer: {values}});
    const result = extractMultiSelectValues(question);

    result.push('z');
    expect(values).toHaveLength(2);
  });
});

describe('extractTextValue', () => {
  it('should extract text from question answer', () => {
    const question = makeQuestion({answer: {text: 'My answer'}});

    expect(extractTextValue(question)).toBe('My answer');
  });

  it('should return empty string when question is undefined', () => {
    expect(extractTextValue(undefined)).toBe('');
  });

  it('should return empty string when answer is null', () => {
    const question = makeQuestion({answer: null});

    expect(extractTextValue(question)).toBe('');
  });

  it('should return empty string when answer has no text', () => {
    const question = makeQuestion({answer: {values: ['a']}});

    expect(extractTextValue(question)).toBe('');
  });
});

describe('buildAnswersPayload', () => {
  it('should build payload with both multi-select and text answers', () => {
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

  it('should skip multi-select when selectedValues is empty', () => {
    const textQuestion = makeQuestion({id: 'q2'});

    const result = buildAnswersPayload({
      multiSelectQuestion: makeQuestion({id: 'q1'}),
      selectedValues: [],
      textQuestion,
      textValue: 'Answer',
    });

    expect(result).toHaveLength(1);
    expect(result[0].question_id).toBe('q2');
  });

  it('should skip text when textValue is only whitespace', () => {
    const multiSelectQuestion = makeQuestion({id: 'q1'});

    const result = buildAnswersPayload({
      multiSelectQuestion,
      selectedValues: ['val1'],
      textQuestion: makeQuestion({id: 'q2'}),
      textValue: '   ',
    });

    expect(result).toHaveLength(1);
    expect(result[0].question_id).toBe('q1');
  });

  it('should return empty array when no questions provided', () => {
    expect(buildAnswersPayload({})).toEqual([]);
  });

  it('should return empty array when questions but no values', () => {
    const result = buildAnswersPayload({
      multiSelectQuestion: makeQuestion({id: 'q1'}),
      selectedValues: undefined,
      textQuestion: makeQuestion({id: 'q2'}),
      textValue: '',
    });

    expect(result).toEqual([]);
  });
});

describe('buildTextAnswersPayload', () => {
  it('should build payload for questions with non-empty answers', () => {
    const questions = [
      makeQuestion({id: 'q1'}),
      makeQuestion({id: 'q2'}),
      makeQuestion({id: 'q3'}),
    ];
    const textAnswers = {q1: 'Answer 1', q2: '   ', q3: 'Answer 3'};

    const result = buildTextAnswersPayload(questions, textAnswers);

    expect(result).toHaveLength(2);
    expect(result[0]).toEqual({answer_text: 'Answer 1', question_id: 'q1'});
    expect(result[1]).toEqual({answer_text: 'Answer 3', question_id: 'q3'});
  });

  it('should return empty array when all answers are empty', () => {
    const questions = [makeQuestion({id: 'q1'})];

    expect(buildTextAnswersPayload(questions, {q1: ''})).toEqual([]);
  });

  it('should return empty array for empty questions', () => {
    expect(buildTextAnswersPayload([], {})).toEqual([]);
  });

  it('should skip questions with no matching answer', () => {
    const questions = [makeQuestion({id: 'q1'})];

    expect(buildTextAnswersPayload(questions, {})).toEqual([]);
  });
});

describe('buildStepUrl', () => {
  it('should build URL with admin token', () => {
    const url = buildStepUrl('proj-123', 2, 'my-token');

    expect(url).toBe(
      '/evp-architect/project/proj-123/employer-survey/step-2?admin=my-token',
    );
  });

  it('should build URL without admin token when null', () => {
    const url = buildStepUrl('proj-123', 3, null);

    expect(url).toBe('/evp-architect/project/proj-123/employer-survey/step-3');
  });

  it('should handle step 1', () => {
    const url = buildStepUrl('abc', 1, 'token');

    expect(url).toBe(
      '/evp-architect/project/abc/employer-survey/step-1?admin=token',
    );
  });
});

describe('buildProjectUrl', () => {
  it('should build project URL', () => {
    expect(buildProjectUrl('proj-456')).toBe('/evp-architect/project/proj-456');
  });
});
