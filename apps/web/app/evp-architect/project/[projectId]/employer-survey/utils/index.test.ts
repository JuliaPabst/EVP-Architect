import {
  buildAnswersPayload,
  buildProjectUrl,
  buildStepUrl,
  buildTextAnswersPayload,
  extractMultiSelectValues,
  extractTextValue,
  findQuestionByType,
  findTextQuestion,
  transformOptionsForSelection,
} from '.';

describe('utils/index re-exports', () => {
  it('exports all utility functions', () => {
    expect(typeof buildAnswersPayload).toBe('function');
    expect(typeof buildProjectUrl).toBe('function');
    expect(typeof buildStepUrl).toBe('function');
    expect(typeof buildTextAnswersPayload).toBe('function');
    expect(typeof extractMultiSelectValues).toBe('function');
    expect(typeof extractTextValue).toBe('function');
    expect(typeof findQuestionByType).toBe('function');
    expect(typeof findTextQuestion).toBe('function');
    expect(typeof transformOptionsForSelection).toBe('function');
  });
});
