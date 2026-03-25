import Link from 'next/link';

import { getServerTranslator } from '@/lib/i18n-server';

export default async function TermsPlaceholderPage() {
  const t = await getServerTranslator();

  return (
    <main className="py-24 text-center">
      <h1 className="text-2xl font-semibold text-[var(--color-text-primary)]">
        {t('Termos', 'Terms')}
      </h1>
      <p className="mt-4 text-[var(--color-text-muted)]">
        {t('Página de termos de serviço (placeholder).', 'Terms of service placeholder.')}
      </p>
      <Link
        href="/"
        className="mt-8 inline-block text-sm font-medium text-[var(--color-accent)] hover:underline"
      >
        ← {t('Voltar ao início', 'Back to home')}
      </Link>
    </main>
  );
}
