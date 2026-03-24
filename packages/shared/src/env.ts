import { z } from 'zod';

const baseSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  DATABASE_URL: z.string().min(1),
  REDIS_URL: z.string().min(1),
  NEXTAUTH_SECRET: z.string().min(32),
  NEXTAUTH_URL: z.string().url().optional(),
  ENCRYPTION_KEY: z.string().length(64).regex(/^[0-9a-fA-F]+$/),
  CLOUD_BILLING: z
    .enum(['true', 'false'])
    .optional()
    .transform((v) => v === 'true'),
  CLOUD_ADVANCED_ALERTS: z
    .enum(['true', 'false'])
    .optional()
    .transform((v) => v === 'true'),
  CLOUD_EXPONENTIAL_RETRY: z
    .enum(['true', 'false'])
    .optional()
    .transform((v) => v === 'true'),
  STRIPE_SECRET_KEY: z.string().optional(),
  STRIPE_WEBHOOK_SECRET: z.string().optional(),
  PAGUE_DEV_WEBHOOK_SECRET: z.string().optional(),
  PILOT_STATUS_API_KEY: z.string().optional(),
  PILOT_STATUS_BASE_URL: z.string().url().optional(),
});

export type PilotEnv = z.infer<typeof baseSchema> & {
  CLOUD_BILLING: boolean;
  CLOUD_ADVANCED_ALERTS: boolean;
  CLOUD_EXPONENTIAL_RETRY: boolean;
};

let cached: PilotEnv | null = null;

export function loadEnv(overrides?: Record<string, string | undefined>): PilotEnv {
  if (cached && !overrides) {
    return cached;
  }
  const merged = { ...process.env, ...overrides } as Record<string, string | undefined>;
  cached = baseSchema.parse(merged) as PilotEnv;
  return cached;
}

export function resetEnvCacheForTests(): void {
  cached = null;
}
