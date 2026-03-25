import Link from 'next/link';
import { notFound } from 'next/navigation';
import { prisma } from '@monitor/database';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import {
  ProjectAlertsForm,
  type ProjectAlertsFormInitial,
} from '@/components/dashboard/project-alerts-form';

type Props = { params: Promise<{ projectId: string }> };

export default async function ProjectAlertsPage({ params }: Props) {
  const { projectId } = await params;
  const session = await getServerSession(authOptions);
  const userId = session!.user!.id;
  const project = await prisma.project.findFirst({
    where: { id: projectId, userId },
    include: { config: true },
  });
  if (!project) notFound();

  const cfg = project.config;
  if (!cfg) notFound();

  const alertsInitial: ProjectAlertsFormInitial = {
    alertCooldown: cfg.alertCooldown,
    alertChannels: [...cfg.alertChannels],
    alertTemplate: cfg.alertTemplate,
    alertEmail: cfg.alertEmail,
    smtpFrom: cfg.smtpFrom,
    smtpHost: cfg.smtpHost,
    smtpPort: cfg.smtpPort,
    smtpUser: cfg.smtpUser,
    webhookUrl: cfg.webhookUrl,
  };

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-[var(--color-text-muted)]">
        <Link href="/projects" className="text-[var(--color-accent)] hover:underline">
          Projects
        </Link>
        <span aria-hidden>·</span>
        <Link
          href={`/projects/${project.id}`}
          className="text-[var(--color-accent)] hover:underline"
        >
          {project.name}
        </Link>
        <span aria-hidden>·</span>
        <span className="text-[var(--color-text-primary)]">Alerts</span>
      </div>

      <h1 className="mb-2 text-2xl font-semibold text-[var(--color-text-primary)]">
        Alert settings
      </h1>
      <p className="mb-8 max-w-2xl text-sm text-[var(--color-text-muted)]">
        Choose notification channels, tune cooldown, and configure SMTP or a webhook endpoint. Health
        check timing stays under{' '}
        <Link href={`/projects/${project.id}`} className="text-[var(--color-accent)] hover:underline">
          Monitoring
        </Link>{' '}
        on the project page.
      </p>

      <section className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-6">
        <ProjectAlertsForm projectId={project.id} initial={alertsInitial} />
      </section>
    </div>
  );
}
