import { timingSafeEqual } from 'node:crypto';

import { prisma } from '@monitor/database';
import bcrypt from 'bcryptjs';
import {
  AppError,
  ErrorType,
  OSS_USER_ID,
  getOssAccessCookieSecretFromProcessEnv,
  isOssAccessLockEnforced,
  isOssAccessPasswordFromEnv,
  loadEnv,
} from '@monitor/shared';

import { signOssAccessCookie } from '@/lib/oss-access-cookie';

const BCRYPT_ROUNDS = 10;

function timingSafeEqualUtf8(a: string, b: string): boolean {
  const bufA = Buffer.from(a, 'utf8');
  const bufB = Buffer.from(b, 'utf8');
  if (bufA.length !== bufB.length) {
    return false;
  }
  return timingSafeEqual(bufA, bufB);
}

function requireCookieSecret(): string {
  const s = getOssAccessCookieSecretFromProcessEnv();
  if (!s) {
    throw new AppError(
      ErrorType.UNKNOWN,
      'Access lock is enabled but ENCRYPTION_KEY (64 hex) or NEXTAUTH_SECRET (32+ chars) is missing from the environment.',
      503,
    );
  }
  return s;
}

export const AccessLockService = {
  isEnforced(): boolean {
    return isOssAccessLockEnforced(loadEnv());
  },

  isMisconfigured(): boolean {
    const env = loadEnv();
    return env.APP_ACCESS_LOCK && getOssAccessCookieSecretFromProcessEnv() === undefined;
  },

  async getStatus(): Promise<{
    lockEnforced: boolean;
    useEnvPassword: boolean;
    needsSetup: boolean;
    misconfigured: boolean;
  }> {
    const env = loadEnv();
    const misconfigured = Boolean(env.APP_ACCESS_LOCK && !getOssAccessCookieSecretFromProcessEnv());
    const lockEnforced = this.isEnforced();
    const useEnvPassword = isOssAccessPasswordFromEnv(env);
    const user = await prisma.user.findUnique({
      where: { id: OSS_USER_ID },
      select: { passwordHash: true },
    });
    const needsSetup = !useEnvPassword && !user?.passwordHash;
    return { lockEnforced, useEnvPassword, needsSetup, misconfigured };
  },

  async setupPassword(plainPassword: string): Promise<string> {
    const env = loadEnv();
    if (!this.isEnforced()) {
      throw new AppError(ErrorType.UNKNOWN, 'Access lock is not enabled', 403);
    }
    if (this.isMisconfigured()) {
      throw new AppError(
        ErrorType.UNKNOWN,
        'Access lock is misconfigured: set ENCRYPTION_KEY or NEXTAUTH_SECRET in the environment.',
        503,
      );
    }
    if (isOssAccessPasswordFromEnv(env)) {
      throw new AppError(ErrorType.UNKNOWN, 'Password is configured via OSS_ACCESS_PASSWORD', 400);
    }
    const user = await prisma.user.findUnique({
      where: { id: OSS_USER_ID },
      select: { passwordHash: true },
    });
    if (user?.passwordHash) {
      throw new AppError(ErrorType.UNKNOWN, 'Password is already set', 400);
    }
    const hash = await bcrypt.hash(plainPassword, BCRYPT_ROUNDS);
    await prisma.user.update({
      where: { id: OSS_USER_ID },
      data: { passwordHash: hash },
    });
    const secret = requireCookieSecret();
    return signOssAccessCookie(secret);
  },

  async verifyAndSignCookie(plainPassword: string): Promise<string> {
    const env = loadEnv();
    if (!this.isEnforced()) {
      throw new AppError(ErrorType.UNKNOWN, 'Access lock is not enabled', 403);
    }
    if (this.isMisconfigured()) {
      throw new AppError(
        ErrorType.UNKNOWN,
        'Access lock is misconfigured: set ENCRYPTION_KEY or NEXTAUTH_SECRET in the environment.',
        503,
      );
    }
    const secret = requireCookieSecret();

    if (isOssAccessPasswordFromEnv(env)) {
      const expected = env.OSS_ACCESS_PASSWORD ?? '';
      if (!timingSafeEqualUtf8(plainPassword, expected)) {
        throw new AppError(ErrorType.AUTH_ERROR, 'Invalid password', 401);
      }
      return signOssAccessCookie(secret);
    }

    const user = await prisma.user.findUnique({
      where: { id: OSS_USER_ID },
      select: { passwordHash: true },
    });
    if (!user?.passwordHash) {
      throw new AppError(ErrorType.UNKNOWN, 'Password is not set yet', 400);
    }
    const ok = await bcrypt.compare(plainPassword, user.passwordHash);
    if (!ok) {
      throw new AppError(ErrorType.AUTH_ERROR, 'Invalid password', 401);
    }
    return signOssAccessCookie(secret);
  },
};
