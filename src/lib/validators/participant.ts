import { z } from 'zod';

export const createParticipantSchema = z.object({
  email: z.string().email(),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
});

export const updateParticipantSchema = z.object({
  status: z.enum(['PENDING', 'INVITED', 'STARTED', 'COMPLETED', 'EXPIRED']).optional(),
  email: z.string().email().optional(),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
});

// For batch import
export const batchParticipantSchema = z.array(createParticipantSchema);
