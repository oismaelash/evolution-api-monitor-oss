import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowDown2 } from 'iconsax-react';
import { prisma } from '@monitor/database';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getServerTranslator } from '@/lib/i18n-server';
import { formatNumberStateLabel } from '@/lib/number-state-label';
import { e164ToDdiAndNational } from '@/lib/e164-fields';
import { EditProjectForm } from '@/components/dashboard/edit-project-form';
import {
  ProjectConfigForm,
  type ProjectConfigFormInitial,
} from '@/components/dashboard/project-config-form';
import { DeleteNumberButton } from '@/components/dashboard/delete-number-button';
import { DeleteProjectButton } from '@/components/dashboard/delete-project-button';
import { SyncInstancesButton } from '@/components/dashboard/sync-instances-button';

type Props = {
  params: Promise<{ projectId: string }>;
  searchParams: Promise<{ tab?: string }>;
};

export default async function ProjectDetailPage({ params, searchParams }: Props) {
  const t = await getServerTranslator();
  const { projectId } = await params;
  const { tab = 'connection' } = await searchParams;
  const session = await getServerSession(authOptions);
  const userId = session!.user!.id;

  const project = await prisma.project.findFirst({
    where: { id: projectId, userId },
    include: {
      config: true,
      numbers: { orderBy: { updatedAt: 'desc' }, take: 50 },
      _count: { select: { numbers: true } },
    },
  });
  if (!project) notFound();

  const { ddi: initialAlertDdi, national: initialAlertNational } = e164ToDdiAndNational(
    project.alertPhone,
  );

  const cfg = project.config;
  const configInitial: ProjectConfigFormInitial | null = cfg
    ? {
        pingInterval: cfg.pingInterval,
        maxRetries: cfg.maxRetries,
        retryDelay: cfg.retryDelay,
        retryStrategy:
          cfg.retryStrategy === 'EXPONENTIAL_JITTER' ? 'EXPONENTIAL_JITTER' : 'FIXED',
      }
    : null;

  return (
    <div>
      <div className="mb-6">
        <Link
          href="/projects"
          className="text-sm text-[var(--color-accent)] hover:underline"
        >
          ← {t('Projetos', 'Projects')}
        </Link>
      </div>

      <h1 className="mb-2 text-2xl font-semibold">{project.name}</h1>
      <p className="mb-8 text-sm text-[var(--color-text-muted)]">
        {project.evolutionFlavor === 'EVOLUTION_GO'
          ? t('Evolution Go', 'Evolution Go')
          : t('Evolution API v2', 'Evolution API v2')}
        {' · '}
        {t('URL Evolution:', 'Evolution URL:')} {project.evolutionUrl}
      </p>

      <div className="mb-8 border-b border-[var(--color-border)]">
        <nav className="-mb-px flex space-x-8" aria-label="Tabs">
          <Link
            href={`/projects/${project.id}?tab=connection`}
            className={`whitespace-nowrap border-b-2 px-1 py-4 text-sm font-medium transition-colors ${
              tab === 'connection'
                ? 'border-[var(--color-accent)] text-[var(--color-accent)]'
                : 'border-transparent text-[var(--color-text-muted)] hover:border-[var(--color-border)] hover:text-[var(--color-text-primary)]'
            }`}
          >
            {t('Conexão', 'Connection')}
          </Link>
          <Link
            href={`/projects/${project.id}?tab=monitoring`}
            className={`whitespace-nowrap border-b-2 px-1 py-4 text-sm font-medium transition-colors ${
              tab === 'monitoring'
                ? 'border-[var(--color-accent)] text-[var(--color-accent)]'
                : 'border-transparent text-[var(--color-text-muted)] hover:border-[var(--color-border)] hover:text-[var(--color-text-primary)]'
            }`}
          >
            {t('Monitoramento', 'Monitoring')}
          </Link>
          <Link
            href={`/projects/${project.id}?tab=numbers`}
            className={`whitespace-nowrap border-b-2 px-1 py-4 text-sm font-medium transition-colors ${
              tab === 'numbers'
                ? 'border-[var(--color-accent)] text-[var(--color-accent)]'
                : 'border-transparent text-[var(--color-text-muted)] hover:border-[var(--color-border)] hover:text-[var(--color-text-primary)]'
            }`}
          >
            {t('Números', 'Numbers')}
          </Link>
        </nav>
      </div>

      {tab === 'connection' && (
        <div className="animate-in fade-in slide-in-from-bottom-2 duration-300 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-6">
          <h2 className="mb-1 text-lg font-medium text-[var(--color-text-primary)]">
            {t('Conexão', 'Connection')}
          </h2>
          <p className="mb-6 text-sm text-[var(--color-text-muted)]">
            {t(
              'Atualize o nome, a URL base da Evolution ou a API key. O pareamento do WhatsApp continua na Evolution; este monitor só armazena credenciais e faz polling de saúde.',
              'Update display name, Evolution base URL, or API key. Pairing WhatsApp still happens in Evolution; this monitor only stores credentials and polls health.',
            )}
          </p>
          
          <EditProjectForm
            projectId={project.id}
            initialName={project.name}
            initialEvolutionUrl={project.evolutionUrl}
            initialEvolutionFlavor={project.evolutionFlavor}
            initialAlertDdi={initialAlertDdi}
            initialAlertNational={initialAlertNational}
          />
          
          <div className="mt-10 border-t border-[var(--color-border)] pt-8">
            <h3 className="mb-1 text-base font-medium text-[var(--color-text-primary)]">
              {t('Zona de perigo', 'Danger zone')}
            </h3>
            <p className="mb-4 text-sm text-[var(--color-text-muted)]">
              {t(
                'Excluir este projeto remove permanentemente todos os números registrados (cascade no banco). Os jobs de health check desses números são limpos primeiro.',
                'Deleting this project removes it permanently and deletes every number registered under it (database cascade). Health check jobs for those numbers are cleared first.',
              )}
            </p>
            <DeleteProjectButton
              projectId={project.id}
              projectName={project.name}
              numberCount={project._count.numbers}
            />
          </div>
        </div>
      )}

      {tab === 'monitoring' && configInitial && (
        <div className="animate-in fade-in slide-in-from-bottom-2 duration-300 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-6">
          <h2 className="mb-1 text-lg font-medium text-[var(--color-text-primary)]">
            {t('Monitoramento', 'Monitoring')}
          </h2>
          <p className="mb-6 text-sm text-[var(--color-text-muted)]">
            {t(
              'Health checks e comportamento de retry. Abra a seção de alertas para canais, SMTP, webhook e modelos.',
              'Health checks and retry behaviour. Open the section for alert channels, SMTP, webhook, and templates.',
            )}
          </p>
          
          <div className="mb-6">
            <Link
              href={`/projects/${project.id}/alerts`}
              className="inline-flex items-center justify-center rounded-md bg-[var(--color-accent)] px-4 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-accent)]"
            >
              {t('Configurações de alerta', 'Alert settings')}
            </Link>
            <p className="mt-3 text-sm text-[var(--color-text-muted)]">
              {t('Canais, SMTP, webhook e modelos.', 'Channels, SMTP, webhook, and templates.')}
            </p>
          </div>
          <ProjectConfigForm projectId={project.id} initial={configInitial} />
        </div>
      )}

      {tab === 'numbers' && (
        <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
          <div className="mb-8 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-6">
            <h2 className="mb-1 text-lg font-medium text-[var(--color-text-primary)]">
              {t('Números', 'Numbers')}
            </h2>
            <p className="mb-6 text-sm text-[var(--color-text-muted)]">
              <strong className="text-[var(--color-text-primary)]">
                {t('Sincronizar instâncias', 'Sync instances')}
              </strong>{' '}
              {t(
                'carrega os nomes de instância do seu servidor Evolution; você escolhe quais adicionar ao projeto.',
                'loads instance names from your Evolution server; you choose which ones to add to this project.',
              )}
            </p>
            <SyncInstancesButton projectId={project.id} />
          </div>

          <h2 className="mb-4 text-lg font-medium">
            {t('Números registrados', 'Registered numbers')}
          </h2>
          <div className="overflow-hidden rounded-lg border border-[var(--color-border)]">
            <table className="w-full text-left text-sm">
              <thead className="bg-[var(--color-surface)] text-[var(--color-text-muted)]">
                <tr>
                  <th className="px-4 py-2">{t('Instância', 'Instance')}</th>
                  <th className="px-4 py-2">{t('Estado', 'State')}</th>
                  <th className="px-4 py-2">{t('Monitorado', 'Monitored')}</th>
                  <th className="w-28 px-4 py-2">{t('Ações', 'Actions')}</th>
                </tr>
              </thead>
              <tbody>
                {project.numbers.length === 0 ? (
                  <tr>
                    <td className="px-4 py-6 text-[var(--color-text-muted)]" colSpan={4}>
                      {t(
                        'Nenhum número ainda. Sincronize instâncias acima para começar.',
                        'No numbers yet. Sync instances above to get started.',
                      )}
                    </td>
                  </tr>
                ) : (
                  project.numbers.map((n: (typeof project.numbers)[number]) => (
                    <tr key={n.id} className="border-t border-[var(--color-border)]">
                      <td className="px-4 py-2">
                        <Link
                          href={`/numbers/${n.id}`}
                          className="text-[var(--color-accent)] hover:underline"
                        >
                          {n.instanceName}
                        </Link>
                      </td>
                      <td className="px-4 py-2">{formatNumberStateLabel(n.state, t)}</td>
                      <td className="px-4 py-2">{n.monitored ? t('sim', 'yes') : t('não', 'no')}</td>
                      <td className="px-4 py-2 align-top">
                        <DeleteNumberButton
                          numberId={n.id}
                          instanceName={n.instanceName}
                          compact
                        />
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

