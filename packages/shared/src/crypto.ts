import { createCipheriv, createDecipheriv, randomBytes, scryptSync } from 'node:crypto';

const IV_LENGTH = 12;
const TAG_LENGTH = 16;
const KEY_LENGTH = 32;

function getKeyFromHex(hexKey: string): Buffer {
  if (hexKey.length !== 64) {
    throw new Error('ENCRYPTION_KEY must be 64 hex characters (32 bytes)');
  }
  return Buffer.from(hexKey, 'hex');
}

/** AES-256-GCM encrypt; returns base64(iv+ciphertext+tag) */
export function encryptSecret(plainText: string, encryptionKeyHex: string): string {
  const key = getKeyFromHex(encryptionKeyHex);
  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv('aes-256-gcm', key, iv);
  const encrypted = Buffer.concat([cipher.update(plainText, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return Buffer.concat([iv, encrypted, tag]).toString('base64');
}

export function decryptSecret(cipherTextBase64: string, encryptionKeyHex: string): string {
  const key = getKeyFromHex(encryptionKeyHex);
  const buf = Buffer.from(cipherTextBase64, 'base64');
  if (buf.length < IV_LENGTH + TAG_LENGTH) {
    throw new Error('Invalid ciphertext');
  }
  const iv = buf.subarray(0, IV_LENGTH);
  const tag = buf.subarray(buf.length - TAG_LENGTH);
  const data = buf.subarray(IV_LENGTH, buf.length - TAG_LENGTH);
  const decipher = createDecipheriv('aes-256-gcm', key, iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(data), decipher.final()]).toString('utf8');
}

/** Derive a deterministic key for HMAC (e.g. webhook signing tests) — prefer env secrets in prod */
export function deriveKeyHmac(secret: string, salt: string): Buffer {
  return scryptSync(secret, salt, 32);
}
