import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { prisma } from '@monitor/database';
import { OSS_USER_ID, resetEnvCacheForTests, loadEnv } from '@monitor/shared';

function refreshEnv(): void {
  resetEnvCacheForTests();
  loadEnv();
}

describe('OSS access lock API', () => {
  const encryptionKey = 'e'.repeat(64);

  beforeEach(async () => {
    resetEnvCacheForTests();
    process.env.ENCRYPTION_KEY = encryptionKey;
    process.env.APP_ACCESS_LOCK = 'true';
    delete process.env.OSS_ACCESS_PASSWORD;
    await prisma.user.upsert({
      where: { id: OSS_USER_ID },
      create: {
        id: OSS_USER_ID,
        email: 'oss-access-test@localhost',
        name: 'OSS',
        passwordHash: null,
      },
      update: { passwordHash: null },
    });
  });

  afterEach(() => {
    resetEnvCacheForTests();
    delete process.env.OSS_ACCESS_PASSWORD;
  });

  it('should verify OSS_ACCESS_PASSWORD and set cookie', async () => {
    process.env.OSS_ACCESS_PASSWORD = 'from-env-xyz';
    refreshEnv();
    const { POST } = await import('./verify/route');
    const req = new Request('http://localhost/api/access/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password: 'from-env-xyz' }),
    });
    const res = await POST(req);
    expect(res.status).toBe(200);
    const setCookie = res.headers.getSetCookie?.() ?? res.headers.get('set-cookie');
    const joined = Array.isArray(setCookie) ? setCookie.join(';') : String(setCookie ?? '');
    expect(joined).toMatch(/monitor_oss_access=/);
  });

  it('should reject wrong env password', async () => {
    process.env.OSS_ACCESS_PASSWORD = 'from-env-xyz';
    refreshEnv();
    const { POST } = await import('./verify/route');
    const req = new Request('http://localhost/api/access/verify', {
      method: 'POST',
      body: JSON.stringify({ password: 'wrong' }),
    });
    const res = await POST(req);
    expect(res.status).toBe(401);
  });

  it('should setup DB password when env password unset', async () => {
    refreshEnv();
    const { POST } = await import('./setup/route');
    const req = new Request('http://localhost/api/access/setup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password: 'first-time-1', confirmPassword: 'first-time-1' }),
    });
    const res = await POST(req);
    expect(res.status).toBe(200);
    const u = await prisma.user.findUnique({ where: { id: OSS_USER_ID }, select: { passwordHash: true } });
    expect(u?.passwordHash).toBeTruthy();
  });

  it('should reject setup when OSS_ACCESS_PASSWORD is set', async () => {
    process.env.OSS_ACCESS_PASSWORD = 'env-only';
    refreshEnv();
    const { POST } = await import('./setup/route');
    const req = new Request('http://localhost/api/access/setup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password: 'first-time-1', confirmPassword: 'first-time-1' }),
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it('should return status shape', async () => {
    refreshEnv();
    const { GET } = await import('./status/route');
    const res = await GET();
    expect(res.status).toBe(200);
    const body = (await res.json()) as Record<string, unknown>;
    expect(body).toHaveProperty('lockEnforced');
    expect(body).toHaveProperty('useEnvPassword');
    expect(body).toHaveProperty('needsSetup');
    expect(body).toHaveProperty('misconfigured');
  });
});
