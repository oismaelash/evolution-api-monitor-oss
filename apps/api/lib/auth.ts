import '@/lib/env';
import type { NextAuthOptions } from 'next-auth';
import GitHubProvider from 'next-auth/providers/github';
import GoogleProvider from 'next-auth/providers/google';
import { prisma } from '@monitor/database';
import { loadEnv, SubscriptionStatus } from '@monitor/shared';

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
  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider !== 'google' && account?.provider !== 'github') {
        return false;
      }
      const email = user.email?.toLowerCase();
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
    async jwt({ token, user, account }) {
      if (account?.provider === 'google' || account?.provider === 'github') {
        const email = (user?.email ?? token.email)?.toLowerCase();
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
  },
  secret: process.env.NEXTAUTH_SECRET,
};
