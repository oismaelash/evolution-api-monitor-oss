import '@/lib/env';
import type { NextAuthOptions } from 'next-auth';
import GitHubProvider from 'next-auth/providers/github';
import GoogleProvider from 'next-auth/providers/google';
import { prisma } from '@monitor/database';
import { loadEnv, SubscriptionStatus } from '@monitor/shared';

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

export const authOptions: NextAuthOptions = {
  session: { strategy: 'jwt', maxAge: 30 * 24 * 60 * 60 },
  providers: buildOAuthProviders(),
  debug: process.env.NODE_ENV === 'development',
  callbacks: {
    async signIn({ user, account, profile }) {
      if (account?.provider !== 'google' && account?.provider !== 'github') {
        return false;
      }
      const email = oauthEmailFrom(user, profile);
      if (!email) return false;
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
    },
    async jwt({ token, user, account, profile }) {
      if (account?.provider === 'google' || account?.provider === 'github') {
        const email =
          oauthEmailFrom(user ?? { email: token.email }, profile) ??
          (typeof token.email === 'string' ? token.email.toLowerCase() : undefined);
        if (email) {
          const dbUser = await prisma.user.findUnique({ where: { email } });
          if (dbUser) {
            token.sub = dbUser.id;
          }
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user && token.sub) {
        session.user.id = token.sub;
      }
      return session;
    },
  },
  pages: {
    signIn: '/login',
    error: '/auth/error',
  },
  secret: process.env.NEXTAUTH_SECRET,
};
