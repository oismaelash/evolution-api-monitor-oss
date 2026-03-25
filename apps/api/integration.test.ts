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

  it('merges GitHub OAuth aliases into GITHUB_ID / GITHUB_SECRET', () => {
    const env = loadEnv({
      DATABASE_URL: 'postgresql://u:p@localhost:5432/db',
      REDIS_URL: 'redis://127.0.0.1:6379',
      NEXTAUTH_SECRET: 'x'.repeat(32),
      NEXTAUTH_URL: 'http://localhost:3000',
      ENCRYPTION_KEY: 'a'.repeat(64),
      GITHUB_CLIENT_ID: 'gh-id',
      GITHUB_CLIENT_SECRET: 'gh-secret',
    });
    expect(env.GITHUB_ID).toBe('gh-id');
    expect(env.GITHUB_SECRET).toBe('gh-secret');
  });
});
