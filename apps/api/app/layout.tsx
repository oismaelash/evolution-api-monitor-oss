import type { Metadata } from 'next';
import { Inter } from 'next/font/google';

import { getLocale } from '@/lib/i18n-server';
import { pickLocale } from '@/lib/i18n';

import './globals.css';
import { Providers } from './providers';

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
});

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  return {
    title: pickLocale(
      locale,
      'Evolution API Monitor — saúde das instâncias Evolution API',
      'Evolution API Monitor — Evolution API instance health',
    ),
    description: pickLocale(
      locale,
      'Monitore números WhatsApp conectados via Evolution API. Health checks, recuperação automática, alertas e logs estruturados — self-hosted ou cloud.',
      'Monitor WhatsApp numbers connected through Evolution API. Health checks, automated recovery, alerts, and structured logs—self-hosted or cloud.',
    ),
    metadataBase: new URL('https://evolutionapi.online'),
  };
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const locale = await getLocale();
  const htmlLang = locale === 'pt' ? 'pt-BR' : 'en';

  return (
    <html lang={htmlLang}>
      <body className={`${inter.className} min-h-screen antialiased`}>
        <Providers initialLocale={locale}>{children}</Providers>
      </body>
    </html>
  );
}
