import { describe, expect, it, beforeEach } from 'vitest';
import { encryptForStorage, decryptFromStorage } from './encryption.js';
import { resetEnvCacheForTests } from '@monitor/shared';

describe('encryption', () => {
  beforeEach(() => {
    resetEnvCacheForTests();
    process.env.ENCRYPTION_KEY = 'a'.repeat(64);
  });

  it('encrypts and decrypts correctly using environment key', () => {
    const plain = 'my-secret';
    const cipher = encryptForStorage(plain);
    expect(cipher).not.toBe(plain);
    
    const decrypted = decryptFromStorage(cipher);
    expect(decrypted).toBe(plain);
  });
});
