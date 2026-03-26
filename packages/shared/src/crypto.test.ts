import { describe, it, expect } from 'vitest';
import { encryptSecret, decryptSecret, deriveKeyHmac } from './crypto.js';

describe('crypto', () => {
  const validKey = 'a'.repeat(64); // 32 bytes in hex

  it('encrypts and decrypts secrets', () => {
    const plain = 'super-secret';
    const cipher = encryptSecret(plain, validKey);
    expect(cipher).not.toBe(plain);
    const decrypted = decryptSecret(cipher, validKey);
    expect(decrypted).toBe(plain);
  });

  it('throws on invalid key length', () => {
    expect(() => encryptSecret('a', 'bad')).toThrow('ENCRYPTION_KEY must be 64 hex characters');
    expect(() => decryptSecret('a', 'bad')).toThrow('ENCRYPTION_KEY must be 64 hex characters');
  });

  it('throws on invalid ciphertext format/length', () => {
    // Too short base64 to contain IV + Tag
    const shortCipher = Buffer.from('short').toString('base64');
    expect(() => decryptSecret(shortCipher, validKey)).toThrow('Invalid ciphertext');
  });

  it('deriveKeyHmac returns buffer of length 32', () => {
    const buf = deriveKeyHmac('secret', 'salt');
    expect(buf.length).toBe(32);
  });
});
