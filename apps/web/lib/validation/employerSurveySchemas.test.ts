import {
  answerInputSchema,
  saveStepAnswersSchema,
} from './employerSurveySchemas';

describe('employerSurveySchemas re-exports', () => {
  it('re-exports answerInputSchema', () => {
    expect(answerInputSchema).toBeDefined();
  });

  it('re-exports saveStepAnswersSchema', () => {
    expect(saveStepAnswersSchema).toBeDefined();
  });
});
