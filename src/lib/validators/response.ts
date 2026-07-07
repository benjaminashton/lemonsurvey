import { z } from 'zod';

export const submitAnswerSchema = z.object({
  questionId: z.string().cuid(),
  textValue: z.string().nullable().optional(),
  choiceValues: z.array(z.string()).optional(),
  numericValue: z.number().nullable().optional(),
  fileUrl: z.string().nullable().optional(),
});

export const submitResponseSchema = z.object({
  surveyId: z.string().cuid(),
  participantToken: z.string().optional(),
  answers: z.array(submitAnswerSchema).min(1),
});

export type SubmitAnswerInput = z.infer<typeof submitAnswerSchema>;
export type SubmitResponseInput = z.infer<typeof submitResponseSchema>;
