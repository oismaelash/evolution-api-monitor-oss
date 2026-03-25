/** NextAuth error query values — see next-auth/core/index.js (error action) */
export type AuthErrorHint = { pt: string; en: string };

export const AUTH_ERROR_HINTS: Record<string, AuthErrorHint> = {
  OAuthSignin: {
    pt: 'Não foi possível iniciar o login com o provedor. Verifique client ID e secret no ambiente.',
    en: 'Could not start sign-in with the provider. Check client ID and secret in your environment.',
  },
  OAuthCallback: {
    pt: 'Falha no callback OAuth. Use o mesmo host que NEXTAUTH_URL (prefira http://localhost:3000, não 127.0.0.1). Garanta que NEXTAUTH_URL use http:// quando você acessa por HTTP (cookies Secure são ignorados em HTTP simples). No Google Cloud, adicione o redirect URI: {origin}/api/auth/callback/google',
    en: 'OAuth callback failed. Use the same host as NEXTAUTH_URL (prefer http://localhost:3000, not 127.0.0.1). Ensure NEXTAUTH_URL uses http:// when you browse over HTTP (Secure cookies are skipped on plain HTTP). In Google Cloud, add redirect URI: {origin}/api/auth/callback/google',
  },
  OAuthCreateAccount: {
    pt: 'Não foi possível criar a conta de usuário após o OAuth.',
    en: 'Could not create the user account after OAuth.',
  },
  OAuthAccountNotLinked: {
    pt: 'Esta conta OAuth não está vinculada a um usuário existente.',
    en: 'This OAuth account is not linked to an existing user.',
  },
  EmailSignin: {
    pt: 'Não foi possível enviar o link de login por e-mail.',
    en: 'The email sign-in link could not be sent.',
  },
  CredentialsSignin: {
    pt: 'Credenciais inválidas.',
    en: 'Invalid credentials.',
  },
  AccessDenied: {
    pt: 'Login negado (e-mail ausente, callback rejeitou o usuário ou banco não migrado). Se o projeto é novo, execute: npm run db:migrate:deploy',
    en: 'Sign-in was denied (missing email, callback rejected the user, or database not migrated). If the project is new, run: npm run db:migrate:deploy',
  },
  SessionRequired: {
    pt: 'Você precisa estar logado para ver esta página.',
    en: 'You must be signed in to view this page.',
  },
  Configuration: {
    pt: 'Problema de configuração do servidor. Verifique NEXTAUTH_SECRET e variáveis OAuth.',
    en: 'Server configuration problem. Check NEXTAUTH_SECRET and OAuth environment variables.',
  },
  Callback: {
    pt: 'Ocorreu um erro durante o callback OAuth.',
    en: 'An error occurred during the OAuth callback.',
  },
  Verification: {
    pt: 'O link de login é inválido ou expirou.',
    en: 'The sign-in link is invalid or expired.',
  },
  Default: {
    pt: 'Falha no login. Verifique os logs do servidor para detalhes.',
    en: 'Sign-in failed. Check the server logs for details.',
  },
};

export function normalizeAuthErrorParam(raw: string | null): string | null {
  if (raw === null || raw === '' || raw === 'undefined') return null;
  return raw;
}
