import { describe, it, expect } from 'vitest';

import {
  getOssAccessCookieSecretFromProcessEnv,
  isOssAccessLockEnforcedFromProcessEnv,
  isOssAccessLockMisconfiguredFromProcessEnv,
} from './oss-access-process-env.js';

describe('oss-access-process-env', () => {
  it('should return secret from NEXTAUTH_SECRET when long enough', () => {
    const secret = getOssAccessCookieSecretFromProcessEnv({
      NEXTAUTH_SECRET: 'a'.repeat(32),
    });
    expect(secret).toBe('a'.repeat(32));
  });

  it('should return lowercased ENCRYPTION_KEY when 64 hex', () => {
    const hex = 'A'.repeat(64);
    const secret = getOssAccessCookieSecretFromProcessEnv({ ENCRYPTION_KEY: hex });
    expect(secret).toBe('a'.repeat(64));
  });

  it('should not enforce lock when APP_ACCESS_LOCK is false', () => {
    expect(
      isOssAccessLockEnforcedFromProcessEnv({
        APP_ACCESS_LOCK: 'false',
        ENCRYPTION_KEY: 'b'.repeat(64),
      }),
    ).toBe(false);
  });

  it('should enforce when APP_ACCESS_LOCK unset and ENCRYPTION_KEY valid', () => {
    expect(
      isOssAccessLockEnforcedFromProcessEnv({
        ENCRYPTION_KEY: 'c'.repeat(64),
      }),
    ).toBe(true);
  });

  it('should report misconfigured when lock wanted but no signing secret', () => {
    expect(
      isOssAccessLockMisconfiguredFromProcessEnv({
        ENCRYPTION_KEY: '',
      }),
    ).toBe(true);
  });

  it('should not report misconfigured when APP_ACCESS_LOCK false', () => {
    expect(
      isOssAccessLockMisconfiguredFromProcessEnv({
        APP_ACCESS_LOCK: 'false',
      }),
    ).toBe(false);
  });
});
