import { describe, it, expect, beforeEach } from 'vitest';
import { loadEnv, resetEnvCacheForTests } from '@monitor/shared';

describe('integration smoke', () => {
  beforeEach(() => {
    resetEnvCacheForTests();
  });

  it('loads env with overrides', () => {
    const env = loadEnv({
      DATABASE_URL: 'postgresql://u:p@localhost:5432/db',
      REDIS_URL: 'redis://127.0.0.1:6379',
      NEXTAUTH_SECRET: 'x'.repeat(32),
      ENCRYPTION_KEY: 'a'.repeat(64),
    });
    expect(env.REDIS_URL).toBe('redis://127.0.0.1:6379');
    expect(env.CLOUD_BILLING).toBe(false);
  });
});
