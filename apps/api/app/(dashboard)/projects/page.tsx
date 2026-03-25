import Link from 'next/link';
import { prisma } from '@monitor/database';
import { getServerTranslator } from '@/lib/i18n-server';
import { CreateProjectForm } from '@/components/dashboard/create-project-form';
import { ProjectRow } from '@/components/dashboard/project-row';
import { LocalDateTime } from '@/components/ui/local-datetime';

export default async function ProjectsPage() {
  const t = await getServerTranslator();
  const userId = 'oss-user-id';
  
  const projects = await prisma.project.findMany({
    where: { userId },
    orderBy: { updatedAt: 'desc' },
    include: {
      _count: { select: { numbers: true } },
    },
  });

  return (
    <div>
      <h1 className="mb-2 text-2xl font-semibold">{t('Projetos', 'Projects')}</h1>
      <p className="mb-8 text-[var(--color-text-muted)]" suppressHydrationWarning>
        {t(
          'Gerencie servidores Evolution e números monitorados. Crie um projeto abaixo e abra-o para sincronizar instâncias ou adicionar números manualmente.',
          'Manage Evolution servers and monitored numbers. Create a project below, then open it to sync instances or add numbers manually.',
        )}
      </p>

      <div className="mb-10">
        <CreateProjectForm />
      </div>

      <h2 className="mb-4 text-lg font-medium">{t('Seus projetos', 'Your projects')}</h2>
      <div className="overflow-hidden rounded-lg border border-[var(--color-border)]">
        <table className="w-full text-left text-sm">
          <thead className="bg-[var(--color-surface)] text-[var(--color-text-muted)]">
            <tr>
              <th className="px-4 py-2">{t('Nome', 'Name')}</th>
              <th className="px-4 py-2">{t('Tipo', 'Type')}</th>
              <th className="px-4 py-2">{t('Números', 'Numbers')}</th>
              <th className="px-4 py-2">{t('Atualizado', 'Updated')}</th>
            </tr>
          </thead>
          <tbody>
            {projects.length === 0 ? (
              <tr>
                <td className="px-4 py-8 text-[var(--color-text-muted)]" colSpan={4}>
                  {t(
                    'Nenhum projeto ainda. Use o formulário acima para criar.',
                    'No projects yet. Use the form above to create one.',
                  )}
                </td>
              </tr>
            ) : (
              projects.map((p: (typeof projects)[number]) => (
                <ProjectRow
                  key={p.id}
                  id={p.id}
                  name={p.name}
                  evolutionFlavor={p.evolutionFlavor}
                  numbersCount={p._count.numbers}
                  updatedAt={p.updatedAt.toISOString()}
                  flavorGoText={t('Evolution Go', 'Evolution Go')}
                  flavorApiText={t('Evolution API v2', 'Evolution API v2')}
                />
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
