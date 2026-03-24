import { decryptSecret, encryptSecret, loadEnv } from '@monitor/shared';

export function encryptForStorage(plain: string): string {
  return encryptSecret(plain, loadEnv().ENCRYPTION_KEY);
}

export function decryptFromStorage(cipher: string): string {
  return decryptSecret(cipher, loadEnv().ENCRYPTION_KEY);
}
