import { z } from 'zod';

export const createGroupSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200),
  description: z.string().optional(),
  sortOrder: z.number().int().default(0),
  relevance: z.any().nullable().optional(),
});

export const updateGroupSchema = createGroupSchema.partial();

export type CreateGroupInput = z.infer<typeof createGroupSchema>;
export type UpdateGroupInput = z.infer<typeof updateGroupSchema>;
