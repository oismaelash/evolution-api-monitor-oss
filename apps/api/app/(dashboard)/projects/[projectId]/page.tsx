import Link from 'next/link';
import { notFound } from 'next/navigation';
import { prisma } from '@monitor/database';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { AddNumberForm } from '@/components/dashboard/add-number-form';
import { EditProjectForm } from '@/components/dashboard/edit-project-form';
import {
  ProjectConfigForm,
  type ProjectConfigFormInitial,
} from '@/components/dashboard/project-config-form';
import { DeleteNumberButton } from '@/components/dashboard/delete-number-button';
import { DeleteProjectButton } from '@/components/dashboard/delete-project-button';
import { SyncInstancesButton } from '@/components/dashboard/sync-instances-button';

type Props = { params: { projectId: string } };

export default async function ProjectDetailPage({ params }: Props) {
  const session = await getServerSession(authOptions);
  const userId = session!.user!.id;
  const project = await prisma.project.findFirst({
    where: { id: params.projectId, userId },
    include: {
      config: true,
      numbers: { orderBy: { updatedAt: 'desc' }, take: 50 },
      _count: { select: { numbers: true } },
    },
  });
  if (!project) notFound();

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
          ← Projects
        </Link>
      </div>

      <h1 className="mb-2 text-2xl font-semibold">{project.name}</h1>
      <p className="mb-8 text-sm text-[var(--color-text-muted)]">
        Evolution URL: {project.evolutionUrl}
      </p>

      <section className="mb-8 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-6">
        <h2 className="mb-1 text-lg font-medium text-[var(--color-text-primary)]">Connection</h2>
        <p className="mb-6 text-sm text-[var(--color-text-muted)]">
          Update display name, Evolution base URL, or API key. Pairing WhatsApp still happens in
          Evolution; this monitor only stores credentials and polls health.
        </p>
        <EditProjectForm
          projectId={project.id}
          initialName={project.name}
          initialEvolutionUrl={project.evolutionUrl}
          initialAlertPhone={project.alertPhone}
        />
        <div className="mt-10 border-t border-[var(--color-border)] pt-8">
          <h3 className="mb-1 text-base font-medium text-[var(--color-text-primary)]">Danger zone</h3>
          <p className="mb-4 text-sm text-[var(--color-text-muted)]">
            Deleting this project removes it permanently and deletes every number registered under it
            (database cascade). Health check jobs for those numbers are cleared first.
          </p>
          <DeleteProjectButton
            projectId={project.id}
            projectName={project.name}
            numberCount={project._count.numbers}
          />
        </div>
      </section>

      {configInitial ? (
        <section className="mb-8 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-6">
          <h2 className="mb-1 text-lg font-medium text-[var(--color-text-primary)]">Monitoring</h2>
          <p className="mb-6 text-sm text-[var(--color-text-muted)]">
            Health checks and retry behaviour.{' '}
            <Link
              href={`/projects/${project.id}/alerts`}
              className="font-medium text-[var(--color-accent)] hover:underline"
            >
              Alert settings
            </Link>{' '}
            — channels, SMTP, webhook, templates.
          </p>
          <ProjectConfigForm projectId={project.id} initial={configInitial} />
        </section>
      ) : null}

      <section className="mb-8 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-6">
        <h2 className="mb-1 text-lg font-medium text-[var(--color-text-primary)]">Numbers</h2>
        <p className="mb-4 text-sm text-[var(--color-text-muted)]">
          <strong className="text-[var(--color-text-primary)]">Sync instances</strong> imports
          every instance name from your Evolution server into this project. Use{' '}
          <strong className="text-[var(--color-text-primary)]">Add number</strong> if you prefer to
          register an instance name manually (it must match Evolution).
        </p>
        <div className="mb-8">
          <SyncInstancesButton projectId={project.id} />
        </div>
        <h3 className="mb-4 text-base font-medium text-[var(--color-text-primary)]">
          Add number manually
        </h3>
        <AddNumberForm projectId={project.id} />
      </section>

      <h2 className="mb-4 text-lg font-medium">Registered numbers</h2>
      <div className="overflow-hidden rounded-lg border border-[var(--color-border)]">
        <table className="w-full text-left text-sm">
          <thead className="bg-[var(--color-surface)] text-[var(--color-text-muted)]">
            <tr>
              <th className="px-4 py-2">Instance</th>
              <th className="px-4 py-2">State</th>
              <th className="px-4 py-2">Monitored</th>
              <th className="px-4 py-2 w-28">Actions</th>
            </tr>
          </thead>
          <tbody>
            {project.numbers.length === 0 ? (
              <tr>
                <td className="px-4 py-6 text-[var(--color-text-muted)]" colSpan={4}>
                  No numbers yet. Sync instances or add one manually above.
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
                  <td className="px-4 py-2">{n.state}</td>
                  <td className="px-4 py-2">{n.monitored ? 'yes' : 'no'}</td>
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
  );
}
