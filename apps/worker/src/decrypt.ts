import { decryptSecret } from '@monitor/shared';
import { loadEnv } from '@monitor/shared';

export function decryptProjectSecret(cipher: string): string {
  const env = loadEnv();
  return decryptSecret(cipher, env.ENCRYPTION_KEY);
}
