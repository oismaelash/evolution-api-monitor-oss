import '@/lib/env';
import type { NextAuthOptions } from 'next-auth';
import GitHubProvider from 'next-auth/providers/github';
import GoogleProvider from 'next-auth/providers/google';
import { Prisma, prisma } from '@monitor/database';
import { loadEnv, SubscriptionStatus } from '@monitor/shared';

function isMissingTableError(e: unknown): boolean {
  return e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2021';
}

/** OAuth providers — see https://next-auth.js.org/providers/google and https://next-auth.js.org/providers/github */

function oauthEmailFrom(
  user: { email?: string | null },
  profile: unknown
): string | undefined {
  const fromUser = user.email?.trim();
  if (fromUser) return fromUser.toLowerCase();
  if (profile && typeof profile === 'object' && profile !== null && 'email' in profile) {
    const e = (profile as { email?: string | null }).email;
    if (typeof e === 'string' && e.trim()) return e.trim().toLowerCase();
  }
  return undefined;
}

function buildOAuthProviders() {
  const env = loadEnv();
  const providers = [];
  if (env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET) {
    providers.push(
      GoogleProvider({
        clientId: env.GOOGLE_CLIENT_ID,
        clientSecret: env.GOOGLE_CLIENT_SECRET,
      })
    );
  }
  if (env.GITHUB_ID && env.GITHUB_SECRET) {
    providers.push(
      GitHubProvider({
        clientId: env.GITHUB_ID,
        clientSecret: env.GITHUB_SECRET,
      })
    );
  }
  return providers;
}

function isGoogleEmailVerified(profile: unknown): boolean {
  if (!profile || typeof profile !== 'object' || !('email_verified' in profile)) {
    return true;
  }
  const v = (profile as { email_verified?: boolean }).email_verified;
  return v !== false;
}

export const authOptions: NextAuthOptions = {
  session: { strategy: 'jwt', maxAge: 30 * 24 * 60 * 60 },
  providers: buildOAuthProviders(),
  /** Must match the real browser connection: Secure cookies are not stored on HTTP. */
  useSecureCookies: process.env.NODE_ENV === 'production',
  /** Opt-in only: NextAuth debug logs OAuth tokens and provider secrets — never enable in production. */
  debug: process.env.NEXTAUTH_DEBUG === 'true',
  callbacks: {
    async signIn({ user, account, profile }) {
      if (account?.provider !== 'google' && account?.provider !== 'github') {
        return false;
      }
      if (account?.provider === 'google' && !isGoogleEmailVerified(profile)) {
        return false;
      }
      const email = oauthEmailFrom(user, profile);
      if (!email) return false;
      try {
        let dbUser = await prisma.user.findUnique({ where: { email } });
        if (!dbUser) {
          dbUser = await prisma.user.create({
            data: {
              email,
              name: user.name ?? undefined,
              image: user.image ?? undefined,
            },
          });
          if (loadEnv().CLOUD_BILLING) {
            await prisma.subscription.create({
              data: {
                userId: dbUser.id,
                status: SubscriptionStatus.TRIALING as never,
                trialEndsAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
              },
            });
          }
        }
        return true;
      } catch (e) {
        if (isMissingTableError(e)) {
          console.error(
            '[auth] Database schema missing (e.g. User table). Apply migrations: npm run db:migrate:deploy'
          );
          return false;
        }
        throw e;
      }
    },
    async jwt({ token, user, account, profile }) {
      /** Map OAuth session to DB user id whenever we can resolve email (not only on first sign-in). */
      const email =
        oauthEmailFrom(user ?? { email: token.email }, profile) ??
        (typeof token.email === 'string' ? token.email.toLowerCase() : undefined);
      if (email) {
        const dbUser = await prisma.user.findUnique({ where: { email } });
        if (dbUser) {
          token.sub = dbUser.id;
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (!session.user) {
        return session;
      }
      /** Always use our DB User.id — never trust JWT `sub` alone (OAuth provider ids are not FK-safe). */
      const email =
        session.user.email?.trim().toLowerCase() ??
        (typeof token.email === 'string' ? token.email.trim().toLowerCase() : '');
      try {
        if (email) {
          const dbUser = await prisma.user.findUnique({ where: { email } });
          if (dbUser) {
            session.user.id = dbUser.id;
            return session;
          }
        }
        if (token.sub) {
          const byId = await prisma.user.findUnique({ where: { id: token.sub } });
          if (byId) {
            session.user.id = byId.id;
            return session;
          }
        }
        session.user.id = '';
      } catch (e) {
        if (isMissingTableError(e)) {
          console.error(
            '[auth] Database schema missing (e.g. User table). Apply migrations: npm run db:migrate:deploy'
          );
          session.user.id = '';
        } else {
          throw e;
        }
      }
      return session;
    },
  },
  pages: {
    signIn: '/login',
  },
  secret: process.env.NEXTAUTH_SECRET,
};
