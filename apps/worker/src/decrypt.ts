import { decryptSecret } from '@pilot/shared';
import { loadEnv } from '@pilot/shared';

export function decryptProjectSecret(cipher: string): string {
  const env = loadEnv();
  return decryptSecret(cipher, env.ENCRYPTION_KEY);
}
