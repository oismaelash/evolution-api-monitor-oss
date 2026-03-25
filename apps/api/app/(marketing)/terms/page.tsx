import Link from 'next/link';
import { getServerTranslator } from '@/lib/i18n-server';

export default async function TermsPage() {
  const t = await getServerTranslator();

  return (
    <main className="py-24 max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="space-y-8">
        <div>
          <h1 className="text-4xl font-bold tracking-tight text-[var(--color-text-primary)] mb-4">
            {t('Termos de Serviço', 'Terms of Service')}
          </h1>
          <p className="text-[var(--color-text-muted)]">
            {t('Última atualização: 25 de Março de 2026', 'Last updated: March 25, 2026')}
          </p>
        </div>

        <section className="space-y-4 text-[var(--color-text-primary)] leading-relaxed">
          <h2 className="text-2xl font-semibold mt-8 mb-4">
            {t('1. Aceitação dos Termos', '1. Acceptance of Terms')}
          </h2>
          <p>
            {t(
              'Ao acessar e utilizar o Evolution API Monitor, você concorda em cumprir e ficar vinculado a estes Termos de Serviço. Se você não concordar com qualquer parte destes termos, não poderá utilizar nossos serviços.',
              'By accessing and using Evolution API Monitor, you agree to comply with and be bound by these Terms of Service. If you do not agree to any part of these terms, you may not use our services.'
            )}
          </p>

          <h2 className="text-2xl font-semibold mt-8 mb-4">
            {t('2. Descrição do Serviço', '2. Description of Service')}
          </h2>
          <p>
            {t(
              'O Evolution API Monitor fornece ferramentas de monitoramento, alertas e relatórios de tempo de atividade para instâncias da Evolution API. Nós não somos afiliados ou endossados oficialmente pelos criadores da Evolution API.',
              'Evolution API Monitor provides monitoring tools, alerts, and uptime reporting for Evolution API instances. We are not officially affiliated with or endorsed by the creators of the Evolution API.'
            )}
          </p>
          <p>
            {t(
              'O serviço é fornecido "como está", e não garantimos que o monitoramento será ininterrupto, livre de erros ou totalmente seguro.',
              'The service is provided "as is", and we do not guarantee that monitoring will be uninterrupted, error-free, or entirely secure.'
            )}
          </p>

          <h2 className="text-2xl font-semibold mt-8 mb-4">
            {t('3. Responsabilidades do Usuário', '3. User Responsibilities')}
          </h2>
          <ul className="list-disc pl-6 space-y-2">
            <li>
              {t(
                'Você é responsável por manter a confidencialidade de suas credenciais de API fornecidas ao nosso sistema.',
                'You are responsible for maintaining the confidentiality of your API credentials provided to our system.'
              )}
            </li>
            <li>
              {t(
                'Você concorda em não usar o serviço para fins ilegais ou não autorizados.',
                'You agree not to use the service for any illegal or unauthorized purpose.'
              )}
            </li>
            <li>
              {t(
                'Você deve ter autorização para monitorar os números e instâncias que adicionar à sua conta.',
                'You must have authorization to monitor the numbers and instances you add to your account.'
              )}
            </li>
          </ul>

          <h2 className="text-2xl font-semibold mt-8 mb-4">
            {t('4. Assinaturas e Pagamentos', '4. Subscriptions and Payments')}
          </h2>
          <p>
            {t(
              'Alguns recursos do serviço exigem uma assinatura paga. As taxas são cobradas antecipadamente com base no ciclo de faturamento escolhido (mensal ou anual). Não oferecemos reembolsos para períodos parciais.',
              'Some features of the service require a paid subscription. Fees are billed in advance based on your chosen billing cycle (monthly or annually). We do not offer refunds for partial periods.'
            )}
          </p>

          <h2 className="text-2xl font-semibold mt-8 mb-4">
            {t('5. Limitação de Responsabilidade', '5. Limitation of Liability')}
          </h2>
          <p>
            {t(
              'Em nenhuma circunstância o Evolution API Monitor será responsável por danos indiretos, incidentais, especiais ou consequentes decorrentes do uso ou da incapacidade de usar nosso serviço, incluindo perda de dados, lucros ou interrupção de negócios.',
              'In no event shall Evolution API Monitor be liable for any indirect, incidental, special, or consequential damages arising out of the use or inability to use our service, including loss of data, profits, or business interruption.'
            )}
          </p>

          <h2 className="text-2xl font-semibold mt-8 mb-4">
            {t('6. Modificações nos Termos', '6. Modifications to Terms')}
          </h2>
          <p>
            {t(
              'Reservamo-nos o direito de modificar ou substituir estes Termos a qualquer momento. Se uma revisão for material, tentaremos fornecer um aviso com pelo menos 30 dias de antecedência antes que os novos termos entrem em vigor.',
              'We reserve the right to modify or replace these Terms at any time. If a revision is material, we will try to provide at least 30 days notice prior to any new terms taking effect.'
            )}
          </p>
        </section>

        <div className="pt-12 border-t border-[var(--color-border)]">
          <Link
            href="/"
            className="inline-flex items-center text-sm font-medium text-[var(--color-accent)] hover:underline transition-colors"
          >
            ← {t('Voltar ao início', 'Back to home')}
          </Link>
        </div>
      </div>
    </main>
  );
}
