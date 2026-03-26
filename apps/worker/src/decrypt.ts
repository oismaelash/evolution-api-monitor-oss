import { decryptSecret, encryptSecret } from '@monitor/shared';
import { loadEnv } from '@monitor/shared';

export function decryptProjectSecret(cipher: string): string {
  const env = loadEnv();
  return decryptSecret(cipher, env.ENCRYPTION_KEY);
}

export function encryptProjectSecret(plain: string): string {
  const env = loadEnv();
  return encryptSecret(plain, env.ENCRYPTION_KEY);
}
