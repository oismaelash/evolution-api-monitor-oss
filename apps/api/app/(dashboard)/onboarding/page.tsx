import Link from 'next/link';
import { prisma } from '@monitor/database';
import { getServerTranslator } from '@/lib/i18n-server';

export default async function OnboardingPage() {
  const t = await getServerTranslator();
  const userId = 'oss-user-id';
  
  const projects = await prisma.project.findMany({
    where: { userId },
    include: { _count: { select: { numbers: true } } },
    orderBy: { createdAt: 'asc' },
  });
  const firstProject = projects[0];

  return (
    <div>
      <h1 className="mb-2 text-2xl font-semibold">{t('Onboarding', 'Onboarding')}</h1>
      <p className="mb-8 text-[var(--color-text-muted)]">
        {t(
          'Crie um projeto, adicione sua URL e API key da Evolution, sincronize instâncias e habilite o monitoramento por número.',
          'Create a project, add your Evolution URL and API key, sync instances, then enable monitoring per number.',
        )}
      </p>
      <ol className="mb-8 list-decimal space-y-3 pl-6 text-sm text-[var(--color-text-primary)]">
        <li>
          <Link href="/projects#create-project" className="text-[var(--color-accent)] hover:underline">
            {t('Crie um projeto', 'Create a project')}
          </Link>{' '}
          {t(
            'com a URL base da Evolution API e a API key (formulário no topo de Projetos).',
            'with your Evolution API base URL and API key (form at the top of Projects).',
          )}
        </li>
        <li>
          {t(
            'Abra o projeto e use Sincronizar instâncias para listar instâncias da Evolution e escolher quais adicionar.',
            'Open the project and use Sync instances to list Evolution instances and choose which ones to add.',
          )}
        </li>
        <li>
          {t(
            'Escolha quais instâncias monitorar e configure canais de alerta nas configurações do projeto.',
            'Choose which instances to monitor and set alert channels in project settings.',
          )}
        </li>
      </ol>
      <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-6 text-sm">
        <div className="text-[var(--color-text-muted)]">{t('Projetos', 'Projects')}</div>
        <div className="mt-2 text-lg font-medium">{projects.length}</div>
        {firstProject ? (
          <p className="mt-4 text-[var(--color-text-muted)]">
            {t('Continue com', 'Continue with')}{' '}
            <Link
              href={`/projects/${firstProject.id}`}
              className="text-[var(--color-accent)] hover:underline"
            >
              {firstProject.name}
            </Link>{' '}
            ({firstProject._count.numbers}{' '}
            {firstProject._count.numbers === 1 ? t('número', 'number') : t('números', 'numbers')}).
          </p>
        ) : (
          <p className="mt-4 text-[var(--color-text-muted)]">
            {t('Nenhum projeto ainda — crie um para começar.', 'No projects yet — create one to begin.')}
          </p>
        )}
      </div>
    </div>
  );
}
