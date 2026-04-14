/**
 * OSS access lock helpers that only read `process.env` — safe for Edge middleware
 * (no `node:crypto` / `loadEnv` side effects).
 */

export function getOssAccessCookieSecretFromProcessEnv(
  env: Record<string, string | undefined> = process.env as Record<string, string | undefined>,
): string | undefined {
  const ns = env.NEXTAUTH_SECRET?.trim();
  if (ns && ns.length >= 32) {
    return ns;
  }
  const ek = env.ENCRYPTION_KEY?.trim();
  if (ek && /^[0-9a-fA-F]{64}$/.test(ek)) {
    return ek.toLowerCase();
  }
  return undefined;
}

/** Edge / middleware: lock on and signing secret present (matches `APP_ACCESS_LOCK` default when unset). */
export function isOssAccessLockEnforcedFromProcessEnv(
  processEnv: Record<string, string | undefined> = process.env as Record<string, string | undefined>,
): boolean {
  if (processEnv.APP_ACCESS_LOCK === 'false') {
    return false;
  }
  return getOssAccessCookieSecretFromProcessEnv(processEnv) !== undefined;
}

/** Lock wanted but cookie cannot be signed — user must set ENCRYPTION_KEY or NEXTAUTH_SECRET. */
export function isOssAccessLockMisconfiguredFromProcessEnv(
  processEnv: Record<string, string | undefined> = process.env as Record<string, string | undefined>,
): boolean {
  if (processEnv.APP_ACCESS_LOCK === 'false') {
    return false;
  }
  return getOssAccessCookieSecretFromProcessEnv(processEnv) === undefined;
}
