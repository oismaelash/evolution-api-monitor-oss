import Link from 'next/link';
import { getServerTranslator } from '@/lib/i18n-server';

export default async function PrivacyPage() {
  const t = await getServerTranslator();

  return (
    <main className="py-24 max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="space-y-8">
        <div>
          <h1 className="text-4xl font-bold tracking-tight text-[var(--color-text-primary)] mb-4">
            {t('Política de Privacidade', 'Privacy Policy')}
          </h1>
          <p className="text-[var(--color-text-muted)]">
            {t('Última atualização: 25 de Março de 2026', 'Last updated: March 25, 2026')}
          </p>
        </div>

        <section className="space-y-4 text-[var(--color-text-primary)] leading-relaxed">
          <h2 className="text-2xl font-semibold mt-8 mb-4">
            {t('1. Informações que Coletamos', '1. Information We Collect')}
          </h2>
          <p>
            {t(
              'Coletamos informações necessárias para fornecer nossos serviços de monitoramento:',
              'We collect information necessary to provide our monitoring services:'
            )}
          </p>
          <ul className="list-disc pl-6 space-y-2">
            <li>
              {t(
                'Informações da conta (nome, e-mail, número de telefone para alertas).',
                'Account information (name, email, phone number for alerts).'
              )}
            </li>
            <li>
              {t(
                'Credenciais e URLs da Evolution API (armazenadas de forma segura e criptografada).',
                'Evolution API credentials and URLs (stored securely and encrypted).'
              )}
            </li>
            <li>
              {t(
                'Dados de uso e métricas geradas a partir do monitoramento de suas instâncias.',
                'Usage data and metrics generated from monitoring your instances.'
              )}
            </li>
          </ul>

          <h2 className="text-2xl font-semibold mt-8 mb-4">
            {t('2. Como Usamos as Informações', '2. How We Use Information')}
          </h2>
          <p>
            {t(
              'Usamos as informações coletadas exclusivamente para:',
              'We use the collected information exclusively to:'
            )}
          </p>
          <ul className="list-disc pl-6 space-y-2">
            <li>
              {t(
                'Monitorar o status e a saúde de suas instâncias da Evolution API.',
                'Monitor the status and health of your Evolution API instances.'
              )}
            </li>
            <li>
              {t(
                'Enviar notificações e alertas sobre quedas ou desconexões.',
                'Send notifications and alerts about downtime or disconnections.'
              )}
            </li>
            <li>
              {t(
                'Melhorar e otimizar o desempenho do nosso serviço.',
                'Improve and optimize the performance of our service.'
              )}
            </li>
          </ul>

          <h2 className="text-2xl font-semibold mt-8 mb-4">
            {t('3. Segurança dos Dados', '3. Data Security')}
          </h2>
          <p>
            {t(
              'Levamos a segurança a sério. Suas chaves de API globais são criptografadas em nosso banco de dados. Implementamos medidas de segurança padrão do setor para proteger contra acesso não autorizado, alteração ou destruição de suas informações pessoais.',
              'We take security seriously. Your global API keys are encrypted in our database. We implement industry-standard security measures to protect against unauthorized access, alteration, or destruction of your personal information.'
            )}
          </p>

          <h2 className="text-2xl font-semibold mt-8 mb-4">
            {t('4. Compartilhamento com Terceiros', '4. Third-Party Sharing')}
          </h2>
          <p>
            {t(
              'Não vendemos, trocamos ou alugamos suas informações de identificação pessoal. Podemos compartilhar informações genéricas não vinculadas a informações de identificação pessoal com provedores de serviços confiáveis, como provedores de e-mail e gateways de pagamento (ex: Stripe), apenas para operar nossos negócios.',
              'We do not sell, trade, or rent your personally identifiable information. We may share generic aggregated demographic information not linked to any personally identifiable information with trusted service providers, such as email providers and payment gateways (e.g., Stripe), only to operate our business.'
            )}
          </p>

          <h2 className="text-2xl font-semibold mt-8 mb-4">
            {t('5. Seus Direitos', '5. Your Rights')}
          </h2>
          <p>
            {t(
              'Você tem o direito de acessar, corrigir ou excluir suas informações pessoais a qualquer momento. Você pode excluir sua conta e todos os dados associados diretamente através do painel de controle ou entrando em contato com nosso suporte.',
              'You have the right to access, correct, or delete your personal information at any time. You can delete your account and all associated data directly through the dashboard or by contacting our support.'
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
