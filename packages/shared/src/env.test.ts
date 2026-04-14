import { describe, it, expect, beforeEach } from 'vitest';
import { loadEnv, resetEnvCacheForTests, getEvolutionTimeoutsMs, isWhatsAppOtpLoginConfigured } from './env.js';

describe('env', () => {
  beforeEach(() => {
    resetEnvCacheForTests();
  });

  const validBaseEnv = {
    DATABASE_URL: 'postgresql://x',
    REDIS_URL: 'redis://x',
    ENCRYPTION_KEY: 'a'.repeat(64),
  };

  it('loads valid base env and applies defaults', () => {
    const env = loadEnv(validBaseEnv);
    expect(env.DATABASE_URL).toBe('postgresql://x');
    expect(env.CLOUD_BILLING).toBe(false);
    expect(env.APP_ACCESS_LOCK).toBe(true);
    expect(env.OPEN_SOURCE_REPO_URL).toBe('https://github.com/oismaelash/evolution-api-monitor');
  });

  it('parses APP_ACCESS_LOCK false and optional OSS_ACCESS_PASSWORD', () => {
    resetEnvCacheForTests();
    const off = loadEnv({ ...validBaseEnv, APP_ACCESS_LOCK: 'false' });
    expect(off.APP_ACCESS_LOCK).toBe(false);

    resetEnvCacheForTests();
    const withPwd = loadEnv({ ...validBaseEnv, OSS_ACCESS_PASSWORD: 'from-env' });
    expect(withPwd.OSS_ACCESS_PASSWORD).toBe('from-env');
  });

  it('treats empty APP_ACCESS_LOCK and BILLING_PRICE_PER_NUMBER_CENTS as unset (Docker Compose empty values)', () => {
    resetEnvCacheForTests();
    const env = loadEnv({
      ...validBaseEnv,
      APP_ACCESS_LOCK: '',
      BILLING_PRICE_PER_NUMBER_CENTS: '',
    });
    expect(env.APP_ACCESS_LOCK).toBe(true);
    expect(env.BILLING_PRICE_PER_NUMBER_CENTS).toBeUndefined();
  });

  it('returns cached env if no overrides', () => {
    const env1 = loadEnv(validBaseEnv);
    const env2 = loadEnv();
    expect(env1).toBe(env2);
  });

  it('throws on missing required fields', () => {
    expect(() => loadEnv({ ...validBaseEnv, DATABASE_URL: undefined })).toThrow();
  });

  it('throws if NEXTAUTH_URL is missing but OAuth is configured', () => {
    expect(() => loadEnv({ ...validBaseEnv, GOOGLE_CLIENT_ID: 'x', GOOGLE_CLIENT_SECRET: 'y' })).toThrow(/NEXTAUTH_URL/);
    expect(() => loadEnv({ ...validBaseEnv, GITHUB_ID: 'x', GITHUB_SECRET: 'y' })).toThrow(/NEXTAUTH_URL/);
    expect(() => loadEnv({ ...validBaseEnv, GITHUB_CLIENT_ID: 'x', GITHUB_CLIENT_SECRET: 'y' })).toThrow(/NEXTAUTH_URL/);
  });

  it('throws if NEXTAUTH_URL is missing but WhatsApp OTP is configured', () => {
    expect(() => loadEnv({ ...validBaseEnv, MONITOR_STATUS_API_KEY: 'x' })).toThrow(/NEXTAUTH_URL/);
  });

  it('transforms GITHUB_CLIENT_ID/SECRET to GITHUB_ID/SECRET', () => {
    const env = loadEnv({
      ...validBaseEnv,
      NEXTAUTH_URL: 'http://x',
      GITHUB_CLIENT_ID: 'cid',
      GITHUB_CLIENT_SECRET: 'csec',
    });
    expect(env.GITHUB_ID).toBe('cid');
    expect(env.GITHUB_SECRET).toBe('csec');
  });

  it('OPEN_SOURCE_REPO_URL uses value if provided', () => {
    const env = loadEnv({ ...validBaseEnv, OPEN_SOURCE_REPO_URL: 'http://custom' });
    expect(env.OPEN_SOURCE_REPO_URL).toBe('http://custom');
  });

  it('getEvolutionTimeoutsMs returns defaults or env values', () => {
    loadEnv(validBaseEnv); // ensure cached
    const defaults = getEvolutionTimeoutsMs(); // uses validBaseEnv from cached
    expect(defaults.pingTimeoutMs).toBe(5000);
    expect(defaults.restartTimeoutMs).toBe(10000);

    resetEnvCacheForTests();
    loadEnv({ ...validBaseEnv, PING_TIMEOUT_MS: '1000', RESTART_TIMEOUT_MS: '2000' });
    const custom = getEvolutionTimeoutsMs();
    expect(custom.pingTimeoutMs).toBe(1000);
    expect(custom.restartTimeoutMs).toBe(2000);
  });

  it('treats empty or zero Evolution timeout env as unset (Docker compose ${VAR:-})', () => {
    resetEnvCacheForTests();
    loadEnv({
      ...validBaseEnv,
      PING_TIMEOUT_MS: '',
      RESTART_TIMEOUT_MS: '   ',
    });
    expect(getEvolutionTimeoutsMs()).toEqual({ pingTimeoutMs: 5000, restartTimeoutMs: 10_000 });

    resetEnvCacheForTests();
    loadEnv({ ...validBaseEnv, PING_TIMEOUT_MS: '0', RESTART_TIMEOUT_MS: '-1' });
    expect(getEvolutionTimeoutsMs()).toEqual({ pingTimeoutMs: 5000, restartTimeoutMs: 10_000 });
  });

  it('isWhatsAppOtpLoginConfigured checks MONITOR_STATUS_API_KEY', () => {
    const noAuth = loadEnv(validBaseEnv);
    expect(isWhatsAppOtpLoginConfigured(noAuth)).toBe(false);

    resetEnvCacheForTests();
    const withAuth = loadEnv({ ...validBaseEnv, NEXTAUTH_URL: 'http://x', MONITOR_STATUS_API_KEY: 'x' });
    expect(isWhatsAppOtpLoginConfigured(withAuth)).toBe(true);
  });
});
