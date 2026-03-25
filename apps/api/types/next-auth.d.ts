import 'next-auth';

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
      /** True when user signed up with WhatsApp OTP and has not set a display name yet. */
      requiresDisplayName?: boolean;
    };
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    sub: string;
  }
}
