/** Must match `OSS_USER_ID` in `@monitor/shared` (Edge-safe: no barrel import). */
const OSS_ACCESS_TOKEN_SUB = 'oss-user-id';

export const OSS_ACCESS_COOKIE_NAME = 'monitor_oss_access';

/** Max-Age (seconds) for unlock cookie — keep in sync with payload `exp` TTL. */
export const OSS_ACCESS_COOKIE_MAX_AGE_SEC = 7 * 24 * 60 * 60;

const COOKIE_TTL_SEC = OSS_ACCESS_COOKIE_MAX_AGE_SEC;

function encoder(): TextEncoder {
  return new TextEncoder();
}

function base64UrlEncode(bytes: Uint8Array): string {
  let bin = '';
  for (let i = 0; i < bytes.length; i += 1) {
    bin += String.fromCharCode(bytes[i]!);
  }
  const b64 = btoa(bin);
  return b64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function base64UrlDecode(s: string): Uint8Array {
  const pad = s.length % 4 === 0 ? '' : '='.repeat(4 - (s.length % 4));
  const b64 = s.replace(/-/g, '+').replace(/_/g, '/') + pad;
  const bin = atob(b64);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i += 1) {
    out[i] = bin.charCodeAt(i);
  }
  return out;
}

async function importHmacKey(secret: string): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    'raw',
    encoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign', 'verify'],
  );
}

function timingSafeEqualUint8(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length !== b.length) {
    return false;
  }
  let diff = 0;
  for (let i = 0; i < a.length; i += 1) {
    diff |= a[i]! ^ b[i]!;
  }
  return diff === 0;
}

export async function signOssAccessCookie(secret: string): Promise<string> {
  const exp = Math.floor(Date.now() / 1000) + COOKIE_TTL_SEC;
  const payload = JSON.stringify({ sub: OSS_ACCESS_TOKEN_SUB, exp });
  const payloadPart = base64UrlEncode(encoder().encode(payload));
  const key = await importHmacKey(secret);
  const sigBuf = await crypto.subtle.sign('HMAC', key, encoder().encode(payloadPart));
  const sigPart = base64UrlEncode(new Uint8Array(sigBuf));
  return `${payloadPart}.${sigPart}`;
}

export async function verifyOssAccessCookie(secret: string, token: string | undefined): Promise<boolean> {
  if (!token || !token.includes('.')) {
    return false;
  }
  const dot = token.indexOf('.');
  const payloadPart = token.slice(0, dot);
  const sigPart = token.slice(dot + 1);
  if (!payloadPart || !sigPart) {
    return false;
  }
  let sigBytes: Uint8Array;
  try {
    sigBytes = base64UrlDecode(sigPart);
  } catch {
    return false;
  }
  const key = await importHmacKey(secret);
  const expectedBuf = await crypto.subtle.sign('HMAC', key, encoder().encode(payloadPart));
  const expected = new Uint8Array(expectedBuf);
  if (!timingSafeEqualUint8(expected, sigBytes)) {
    return false;
  }
  let payload: { sub?: string; exp?: number };
  try {
    const json = new TextDecoder().decode(base64UrlDecode(payloadPart));
    payload = JSON.parse(json) as { sub?: string; exp?: number };
  } catch {
    return false;
  }
  if (payload.sub !== OSS_ACCESS_TOKEN_SUB || typeof payload.exp !== 'number') {
    return false;
  }
  if (payload.exp <= Math.floor(Date.now() / 1000)) {
    return false;
  }
  return true;
}
