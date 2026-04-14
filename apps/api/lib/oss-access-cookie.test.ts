import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

import { signOssAccessCookie, verifyOssAccessCookie } from './oss-access-cookie';

describe('oss-access-cookie', () => {
  const secret = 'z'.repeat(32);

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-01-01T00:00:00.000Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should sign and verify a valid cookie', async () => {
    const token = await signOssAccessCookie(secret);
    expect(await verifyOssAccessCookie(secret, token)).toBe(true);
  });

  it('should reject wrong secret', async () => {
    const token = await signOssAccessCookie(secret);
    expect(await verifyOssAccessCookie('y'.repeat(32), token)).toBe(false);
  });

  it('should reject tampered payload', async () => {
    const token = await signOssAccessCookie(secret);
    const [p, s] = token.split('.');
    const tampered = `X${p}.${s}`;
    expect(await verifyOssAccessCookie(secret, tampered)).toBe(false);
  });

  it('should reject expired cookie', async () => {
    const token = await signOssAccessCookie(secret);
    vi.setSystemTime(new Date('2099-01-01T00:00:00.000Z'));
    expect(await verifyOssAccessCookie(secret, token)).toBe(false);
  });

  it('should reject wrong sub claim', async () => {
    const exp = Math.floor(Date.now() / 1000) + 3600;
    const payload = JSON.stringify({ sub: 'other', exp });
    const enc = new TextEncoder();
    const payloadPart = Buffer.from(payload).toString('base64url');
    const key = await crypto.subtle.importKey(
      'raw',
      enc.encode(secret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign'],
    );
    const sigBuf = await crypto.subtle.sign('HMAC', key, enc.encode(payloadPart));
    const sigPart = Buffer.from(sigBuf).toString('base64url');
    const token = `${payloadPart}.${sigPart}`;
    expect(await verifyOssAccessCookie(secret, token)).toBe(false);
  });

  it('should accept correct OSS_USER_ID in payload', async () => {
    const exp = Math.floor(Date.now() / 1000) + 3600;
    const payload = JSON.stringify({ sub: 'oss-user-id', exp });
    const enc = new TextEncoder();
    const payloadPart = Buffer.from(payload).toString('base64url');
    const key = await crypto.subtle.importKey(
      'raw',
      enc.encode(secret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign'],
    );
    const sigBuf = await crypto.subtle.sign('HMAC', key, enc.encode(payloadPart));
    const sigPart = Buffer.from(sigBuf).toString('base64url');
    const token = `${payloadPart}.${sigPart}`;
    expect(await verifyOssAccessCookie(secret, token)).toBe(true);
  });
});
