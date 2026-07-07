import { z } from 'zod';

const questionTypeEnum = z.enum([
  'SINGLE_CHOICE',
  'MULTIPLE_CHOICE',
  'DROPDOWN',
  'TEXT_SHORT',
  'TEXT_LONG',
  'RATING',
  'FILE_UPLOAD',
  'EQUATION',
  'PRESENTATION',
]);

const choiceSchema = z.object({
  code: z.string().min(1),
  label: z.string().min(1),
  value: z.string().min(1),
  sortOrder: z.number().int().default(0),
  attachedAsset: z
    .object({
      type: z.enum(['image', 'file', 'html']),
      url: z.string(),
      caption: z.string().optional(),
      showWhen: z.enum(['selected', 'always']).default('selected'),
    })
    .nullable()
    .optional(),
});

export const createQuestionSchema = z.object({
  groupId: z.string().cuid(),
  code: z.string().min(1).max(20),
  text: z.string().min(1),
  helpText: z.string().nullable().optional(),
  type: questionTypeEnum,
  isRequired: z.boolean().default(false),
  sortOrder: z.number().int().default(0),
  relevance: z.any().nullable().optional(),
  equation: z.string().nullable().optional(),
  defaultValue: z.string().nullable().optional(),
  validation: z.any().nullable().optional(),
  choices: z.array(choiceSchema).optional(),
});

export const updateQuestionSchema = createQuestionSchema.partial().omit({ groupId: true });

export type CreateQuestionInput = z.infer<typeof createQuestionSchema>;
export type UpdateQuestionInput = z.infer<typeof updateQuestionSchema>;
