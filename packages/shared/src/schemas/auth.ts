import { z } from 'zod';

export const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(128),
  name: z.string().min(1).max(120).optional(),
});

export type RegisterInput = z.infer<typeof registerSchema>;

/** E.164 with leading + and country code (10–15 digits after +). */
const e164Phone = z
  .string()
  .trim()
  .regex(/^\+\d{10,15}$/, 'Invalid E.164 phone');

export const whatsappOtpRequestSchema = z.object({
  phone: e164Phone,
});

export type WhatsappOtpRequestInput = z.infer<typeof whatsappOtpRequestSchema>;

export const whatsappOtpVerifySchema = z.object({
  phone: e164Phone,
  code: z.string().trim().regex(/^\d{6}$/, 'Invalid code'),
});

export type WhatsappOtpVerifyInput = z.infer<typeof whatsappOtpVerifySchema>;
