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

export type AddNumberInput = z.infer<typeof addNumberSchema>;
export type UpdateNumberInput = z.infer<typeof updateNumberSchema>;
