import { z } from 'zod';

export const createSurveySchema = z.object({
  title: z.string().min(1, 'Title is required').max(200),
  description: z.string().nullable().optional(),
  welcomeText: z.string().nullable().optional(),
  endText: z.string().nullable().optional(),
  allowBack: z.boolean().default(true),
  requireToken: z.boolean().default(true),
});

export const updateSurveySchema = createSurveySchema.partial().extend({
  status: z.enum(['DRAFT', 'ACTIVE', 'CLOSED', 'ARCHIVED']).optional(),
  expiresAt: z.string().datetime().nullable().optional(),
});

export type CreateSurveyInput = z.infer<typeof createSurveySchema>;
export type UpdateSurveyInput = z.infer<typeof updateSurveySchema>;
