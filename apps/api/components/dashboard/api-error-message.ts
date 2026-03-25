/** Parses JSON error body from internal API routes into a single display string (PT/EN via t). */
import type { Translator } from '@/lib/i18n';

/** Known API `error` string literals from routes and AppError messages. */
const KNOWN_API_ERRORS: Record<string, readonly [string, string]> = {
  Unauthorized: ['Não autorizado', 'Unauthorized'],
  Forbidden: ['Proibido', 'Forbidden'],
  'Billing disabled': ['Cobrança desativada', 'Billing disabled'],
  'Email required': ['E-mail obrigatório', 'Email required'],
  'Checkout unavailable (set STRIPE_PRICE_ID)': [
    'Checkout indisponível (defina STRIPE_PRICE_ID)',
    'Checkout unavailable (set STRIPE_PRICE_ID)',
  ],
  'No Stripe customer': ['Nenhum cliente Stripe', 'No Stripe customer'],
  'Portal unavailable': ['Portal indisponível', 'Portal unavailable'],
  'Amount must be >= 1': ['O valor deve ser >= 1', 'Amount must be >= 1'],
  'Description is required': ['Descrição obrigatória', 'Description is required'],
  'Webhook not configured': ['Webhook não configurado', 'Webhook not configured'],
  'Invalid signature': ['Assinatura inválida', 'Invalid signature'],
  'Invalid JSON': ['JSON inválido', 'Invalid JSON'],
  'Missing eventId': ['eventId ausente', 'Missing eventId'],
  'Internal Server Error': ['Erro interno do servidor', 'Internal Server Error'],
  'Missing messageId': ['messageId ausente', 'Missing messageId'],
  'Stripe webhook not configured': ['Webhook Stripe não configurado', 'Stripe webhook not configured'],
  'Email already registered': ['E-mail já cadastrado', 'Email already registered'],
  'Internal server error': ['Erro interno do servidor', 'Internal server error'],
  'Project not found': ['Projeto não encontrado', 'Project not found'],
  'Number not found': ['Número não encontrado', 'Number not found'],
  'Alert not found': ['Alerta não encontrado', 'Alert not found'],
};

const INSTANCE_NOT_ON_EVOLUTION =
  /^Instance "([^"]+)" is not on Evolution \(or was removed since you opened the list\)\.$/;

function translateKnownString(message: string, t: Translator): string | null {
  const pair = KNOWN_API_ERRORS[message];
  if (pair) {
    return t(pair[0], pair[1]);
  }
  const m = INSTANCE_NOT_ON_EVOLUTION.exec(message);
  if (m?.[1]) {
    const name = m[1];
    return t(
      `A instância "${name}" não está na Evolution (ou foi removida desde que você abriu a lista).`,
      `Instance "${name}" is not on Evolution (or was removed since you opened the list).`,
    );
  }
  return null;
}

export function apiErrorMessage(body: unknown, t: Translator): string {
  if (typeof body !== 'object' || body === null || !('error' in body)) {
    return t('Falha na requisição', 'Request failed');
  }
  const err = (body as { error: unknown }).error;
  if (typeof err === 'string') {
    const translated = translateKnownString(err, t);
    return translated ?? err;
  }
  try {
    return JSON.stringify(err);
  } catch {
    return t('Falha na requisição', 'Request failed');
  }
}
