import {z} from 'zod';

export const answerInputSchema = z.object({
  answer_text: z.string().max(10000).optional(),
  question_id: z.string().uuid(),
  selected_values: z.array(z.string()).optional(),
});

export const saveStepAnswersSchema = z.object({
  answers: z.array(answerInputSchema),
});

export type AnswerInput = z.infer<typeof answerInputSchema>;
export type SaveStepAnswersInput = z.infer<typeof saveStepAnswersSchema>;
