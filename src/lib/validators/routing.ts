import { z } from 'zod';

export const createRoutingRuleSchema = z.object({
  name: z.string().min(1),
  condition: z.record(z.string(), z.any()), // RelevanceExpression JSON
  actionType: z.enum(['EMAIL', 'WEBHOOK']),
  recipientEmail: z.string().email().optional().nullable(),
  emailSubject: z.string().optional().nullable(),
  emailBody: z.string().optional().nullable(),
  webhookUrl: z.string().url().optional().nullable(),
  webhookHeaders: z.record(z.string(), z.string()).optional().nullable(),
  isActive: z.boolean().default(true),
});

export const updateRoutingRuleSchema = createRoutingRuleSchema.partial();
