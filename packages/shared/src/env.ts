import { z } from 'zod';

/** Docker/compose often passes `KEY:` with no value → ""; Zod `.url().optional()` rejects "". */
function emptyStringToUndefined(val: unknown): unknown {
  if (val === '' || val === null || val === undefined) return undefined;
  if (typeof val === 'string' && val.trim() === '') return undefined;
  return val;
}

const optionalUrl = z.preprocess(emptyStringToUndefined, z.string().url().optional());

/** Default public repo URL for marketing / self-host links (override via OPEN_SOURCE_REPO_URL). */
const DEFAULT_OPEN_SOURCE_REPO_URL = 'https://github.com/oismaelash/evolution-api-monitor';

/** Raw env including GitHub OAuth aliases (entrevistas-style names). */
const rawEnvSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  DATABASE_URL: z.string().min(1),
  REDIS_URL: z.string().min(1),
  NEXTAUTH_SECRET: z.string().min(32),
  NEXTAUTH_URL: optionalUrl,
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
  MONITOR_STATUS_API_KEY: z.string().optional(),
  MONITOR_STATUS_BASE_URL: optionalUrl,
  /** Pilot Status API `templateId` (dashboard); default applied in worker if unset */
  MONITOR_STATUS_TEMPLATE_ID: z.string().optional(),
  PING_TIMEOUT_MS: z.coerce.number().int().positive().max(120_000).optional(),
  RESTART_TIMEOUT_MS: z.coerce.number().int().positive().max(300_000).optional(),
  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),
  /** NextAuth default naming */
  GITHUB_ID: z.string().optional(),
  GITHUB_SECRET: z.string().optional(),
  /** Alias (e.g. entrevistas project) — merged into GITHUB_ID / GITHUB_SECRET */
  GITHUB_CLIENT_ID: z.string().optional(),
  GITHUB_CLIENT_SECRET: z.string().optional(),
  STRIPE_PUBLISHABLE_KEY: z.string().optional(),
  STRIPE_PRICE_ID: z.string().optional(),
  BILLING_PRICE_PER_NUMBER_CENTS: z.coerce.number().int().positive().optional(),
  PAGUE_DEV_API_KEY: z.string().optional(),
  PAGUE_DEV_BASE_URL: optionalUrl,
  BULL_BOARD_SECRET: z.string().optional(),
  /** Public Git (or other) URL for the open-source monitor repo — marketing links. */
  OPEN_SOURCE_REPO_URL: z.preprocess(
    (val) => {
      const u = emptyStringToUndefined(val);
      if (u === undefined) return DEFAULT_OPEN_SOURCE_REPO_URL;
      return u;
    },
    z.string().url(),
  ),
})
  .superRefine((data, ctx) => {
    const googleOAuth =
      Boolean(data.GOOGLE_CLIENT_ID?.trim()) &&
      Boolean(data.GOOGLE_CLIENT_SECRET?.trim());
    const githubId = data.GITHUB_ID?.trim() || data.GITHUB_CLIENT_ID?.trim();
    const githubSecret = data.GITHUB_SECRET?.trim() || data.GITHUB_CLIENT_SECRET?.trim();
    const githubOAuth = Boolean(githubId && githubSecret);
    if ((googleOAuth || githubOAuth) && !data.NEXTAUTH_URL?.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message:
          'NEXTAUTH_URL is required when Google or GitHub OAuth credentials are set',
        path: ['NEXTAUTH_URL'],
      });
    }
  })
  .transform((data) => {
    const { GITHUB_CLIENT_ID, GITHUB_CLIENT_SECRET, ...rest } = data;
    const githubId =
      rest.GITHUB_ID?.trim() || GITHUB_CLIENT_ID?.trim() || undefined;
    const githubSecret =
      rest.GITHUB_SECRET?.trim() || GITHUB_CLIENT_SECRET?.trim() || undefined;
    return {
      ...rest,
      GITHUB_ID: githubId,
      GITHUB_SECRET: githubSecret,
    };
  });

export const baseSchema = rawEnvSchema;

export type MonitorEnv = z.infer<typeof baseSchema> & {
  CLOUD_BILLING: boolean;
  CLOUD_ADVANCED_ALERTS: boolean;
  CLOUD_EXPONENTIAL_RETRY: boolean;
};

let cached: MonitorEnv | null = null;

export function loadEnv(overrides?: Record<string, string | undefined>): MonitorEnv {
  if (cached && !overrides) {
    return cached;
  }
  const merged = { ...process.env, ...overrides } as Record<string, string | undefined>;
  cached = baseSchema.parse(merged) as MonitorEnv;
  return cached;
}

export function resetEnvCacheForTests(): void {
  cached = null;
}

export function getEvolutionTimeoutsMs(): { pingTimeoutMs: number; restartTimeoutMs: number } {
  const e = loadEnv();
  return {
    pingTimeoutMs: e.PING_TIMEOUT_MS ?? 5000,
    restartTimeoutMs: e.RESTART_TIMEOUT_MS ?? 10_000,
  };
}
