import { z } from 'zod';

export const addNumberSchema = z.object({
  instanceName: z.string().min(1).max(200),
  phoneNumber: z.string().optional(),
  label: z.string().max(200).optional(),
  monitored: z.boolean().optional(),
});

export const updateNumberSchema = z.object({
  label: z.string().max(200).nullable().optional(),
  phoneNumber: z.string().nullable().optional(),
  monitored: z.boolean().optional(),
});

/** Body for POST /api/projects/:id/numbers/sync — only these instances are created (must exist on Evolution). */
export const syncInstancesApplySchema = z.object({
  instanceNames: z.array(z.string().min(1).max(200)).max(500),
});

export type AddNumberInput = z.infer<typeof addNumberSchema>;
export type UpdateNumberInput = z.infer<typeof updateNumberSchema>;
export type SyncInstancesApplyInput = z.infer<typeof syncInstancesApplySchema>;
