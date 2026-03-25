import { z } from 'zod';

import { e164PhoneSchema } from '../phone-e164.js';

export const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(128),
  name: z.string().min(1).max(120).optional(),
});

export type RegisterInput = z.infer<typeof registerSchema>;

export const whatsappOtpRequestSchema = z.object({
  phone: e164PhoneSchema,
});

export type WhatsappOtpRequestInput = z.infer<typeof whatsappOtpRequestSchema>;

export const whatsappOtpVerifySchema = z.object({
  phone: e164PhoneSchema,
  code: z.string().trim().regex(/^\d{6}$/, 'Invalid code'),
});

export type WhatsappOtpVerifyInput = z.infer<typeof whatsappOtpVerifySchema>;

export const updateProfileDisplayNameSchema = z.object({
  name: z.string().trim().min(1).max(120),
});

export type UpdateProfileDisplayNameInput = z.infer<typeof updateProfileDisplayNameSchema>;
