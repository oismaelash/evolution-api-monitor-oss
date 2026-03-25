import Link from 'next/link';

import { getServerTranslator } from '@/lib/i18n-server';

export default async function DocsPlaceholderPage() {
  const t = await getServerTranslator();

  return (
    <main className="py-24 text-center">
      <h1 className="text-2xl font-semibold text-[var(--color-text-primary)]">
        {t('Documentação', 'Documentation')}
      </h1>
      <p className="mt-4 text-[var(--color-text-muted)]">
        {t('A documentação completa será publicada aqui.', 'Full docs will be published here.')}
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
