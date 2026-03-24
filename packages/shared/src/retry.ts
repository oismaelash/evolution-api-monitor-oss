import { RetryStrategy as RetryStrategyEnum } from './enums.js';

export type RetryConfig = {
  retryStrategy: (typeof RetryStrategyEnum)[keyof typeof RetryStrategyEnum];
  retryDelayMs: number;
  attempt: number;
  maxDelayMs?: number;
  jitterMaxMs?: number;
};

const DEFAULT_MAX_DELAY_MS = 300_000;

export function computeDelayMs(config: RetryConfig): number {
  const { retryStrategy, retryDelayMs, attempt, maxDelayMs, jitterMaxMs } = config;
  const cap = maxDelayMs ?? DEFAULT_MAX_DELAY_MS;

  if (retryStrategy === RetryStrategyEnum.FIXED) {
    return retryDelayMs;
  }

  const exp = Math.min(retryDelayMs * 2 ** Math.max(0, attempt - 1), cap);
  const jitter = Math.floor(Math.random() * (jitterMaxMs ?? Math.min(5000, exp)));
  return exp + jitter;
}
