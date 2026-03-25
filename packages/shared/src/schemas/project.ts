import { z } from 'zod';

import { e164PhoneSchema } from '../phone-e164.js';

export const createProjectSchema = z.object({
  name: z.string().min(1).max(200),
  evolutionUrl: z.string().url(),
  evolutionApiKey: z.string().min(1),
  alertPhone: z.preprocess(
    (v) => {
      if (v === undefined || v === null) return undefined;
      if (typeof v !== 'string') return v;
      const t = v.trim();
      return t === '' ? undefined : t;
    },
    e164PhoneSchema.optional(),
  ),
});

export const updateProjectSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  evolutionUrl: z.string().url().optional(),
  evolutionApiKey: z.string().min(1).optional(),
  alertPhone: z.preprocess(
    (v) => {
      if (v === undefined) return undefined;
      if (v === null) return null;
      if (typeof v === 'string' && v.trim() === '') return null;
      if (typeof v === 'string') return v.trim();
      return v;
    },
    z.union([z.null(), e164PhoneSchema]).optional(),
  ),
});

export const projectConfigSchema = z.object({
  pingInterval: z.number().int().min(30).max(86400).optional(),
  maxRetries: z.number().int().min(0).max(10).optional(),
  retryDelay: z.number().int().min(5).max(3600).optional(),
  retryStrategy: z.enum(['FIXED', 'EXPONENTIAL_JITTER']).optional(),
  alertCooldown: z.number().int().min(60).max(86400).optional(),
  alertChannels: z.array(z.enum(['MONITOR_STATUS', 'EMAIL', 'WEBHOOK'])).optional(),
  alertTemplate: z.string().nullable().optional(),
  alertEmail: z.preprocess(
    (v) => (v === '' ? null : v),
    z.union([z.string().email(), z.null()]).optional()
  ),
  smtpFrom: z.preprocess(
    (v) => (v === '' ? null : v),
    z.union([z.string().min(1).max(500), z.null()]).optional()
  ),
  smtpHost: z.string().nullable().optional(),
  smtpPort: z.number().int().nullable().optional(),
  smtpUser: z.string().nullable().optional(),
  smtpPass: z.string().nullable().optional(),
  webhookUrl: z.string().url().nullable().optional(),
  webhookSecret: z.string().nullable().optional(),
});

export type CreateProjectInput = z.infer<typeof createProjectSchema>;
export type UpdateProjectInput = z.infer<typeof updateProjectSchema>;
export type ProjectConfigInput = z.infer<typeof projectConfigSchema>;
