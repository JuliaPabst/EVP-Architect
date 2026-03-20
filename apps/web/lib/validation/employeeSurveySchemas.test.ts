import {
  answerInputSchema,
  saveStepAnswersSchema,
} from './employeeSurveySchemas';

const VALID_UUID = '550e8400-e29b-41d4-a716-446655440000';

describe('answerInputSchema', () => {
  it('accepts a valid payload with only question_id', () => {
    const result = answerInputSchema.safeParse({question_id: VALID_UUID});

    expect(result.success).toBe(true);
  });

  it('accepts a payload with question_id and answer_text', () => {
    const result = answerInputSchema.safeParse({
      answer_text: 'My answer',
      question_id: VALID_UUID,
    });

    expect(result.success).toBe(true);
  });

  it('accepts a payload with question_id and selected_values', () => {
    const result = answerInputSchema.safeParse({
      question_id: VALID_UUID,
      selected_values: ['value_a', 'value_b'],
    });

    expect(result.success).toBe(true);
  });

  it('accepts a payload with all fields', () => {
    const result = answerInputSchema.safeParse({
      answer_text: 'Some text',
      question_id: VALID_UUID,
      selected_values: ['val1'],
    });

    expect(result.success).toBe(true);
  });

  it('rejects when question_id is missing', () => {
    const result = answerInputSchema.safeParse({answer_text: 'My answer'});

    expect(result.success).toBe(false);
  });

  it('rejects when question_id is not a valid UUID', () => {
    const result = answerInputSchema.safeParse({
      question_id: 'not-a-uuid',
    });

    expect(result.success).toBe(false);
  });

  it('rejects when answer_text exceeds 10000 characters', () => {
    const result = answerInputSchema.safeParse({
      answer_text: 'a'.repeat(10001),
      question_id: VALID_UUID,
    });

    expect(result.success).toBe(false);
  });

  it('accepts answer_text of exactly 10000 characters', () => {
    const result = answerInputSchema.safeParse({
      answer_text: 'a'.repeat(10000),
      question_id: VALID_UUID,
    });

    expect(result.success).toBe(true);
  });

  it('accepts empty string for answer_text', () => {
    const result = answerInputSchema.safeParse({
      answer_text: '',
      question_id: VALID_UUID,
    });

    expect(result.success).toBe(true);
  });

  it('accepts an empty selected_values array', () => {
    const result = answerInputSchema.safeParse({
      question_id: VALID_UUID,
      selected_values: [],
    });

    expect(result.success).toBe(true);
  });
});

describe('saveStepAnswersSchema', () => {
  it('accepts a valid payload with an array of answers', () => {
    const result = saveStepAnswersSchema.safeParse({
      answers: [
        {question_id: VALID_UUID, selected_values: ['val1']},
        {answer_text: 'text', question_id: VALID_UUID},
      ],
    });

    expect(result.success).toBe(true);
  });

  it('accepts an empty answers array', () => {
    const result = saveStepAnswersSchema.safeParse({answers: []});

    expect(result.success).toBe(true);
  });

  it('rejects when answers field is missing', () => {
    const result = saveStepAnswersSchema.safeParse({});

    expect(result.success).toBe(false);
  });

  it('rejects when an answer in the array has an invalid question_id', () => {
    const result = saveStepAnswersSchema.safeParse({
      answers: [{question_id: 'bad-uuid'}],
    });

    expect(result.success).toBe(false);
  });

  it('rejects when answers is not an array', () => {
    const result = saveStepAnswersSchema.safeParse({answers: 'not-an-array'});

    expect(result.success).toBe(false);
  });
});
