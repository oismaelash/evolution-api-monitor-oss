import Link from 'next/link';
import { prisma } from '@monitor/database';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export default async function OnboardingPage() {
  const session = await getServerSession(authOptions);
  const userId = session!.user!.id;
  const projects = await prisma.project.findMany({
    where: { userId },
    include: { _count: { select: { numbers: true } } },
    orderBy: { createdAt: 'asc' },
  });
  const firstProject = projects[0];

  return (
    <div>
      <h1 className="mb-2 text-2xl font-semibold">Onboarding</h1>
      <p className="mb-8 text-[var(--color-text-muted)]">
        Create a project, add your Evolution URL and API key, sync instances, then enable monitoring per number.
      </p>
      <ol className="mb-8 list-decimal space-y-3 pl-6 text-sm text-[var(--color-text-primary)]">
        <li>
          <Link href="/projects" className="text-[var(--color-accent)] hover:underline">
            Create a project
          </Link>{' '}
          with your Evolution API base URL and API key.
        </li>
        <li>
          Open the project and use <strong>Sync instances</strong> to import numbers from Evolution.
        </li>
        <li>Choose which instances to monitor and set alert channels in project settings.</li>
      </ol>
      <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-6 text-sm">
        <div className="text-[var(--color-text-muted)]">Projects</div>
        <div className="mt-2 text-lg font-medium">{projects.length}</div>
        {firstProject ? (
          <p className="mt-4 text-[var(--color-text-muted)]">
            Continue with{' '}
            <Link
              href={`/projects/${firstProject.id}`}
              className="text-[var(--color-accent)] hover:underline"
            >
              {firstProject.name}
            </Link>{' '}
            ({firstProject._count.numbers} numbers).
          </p>
        ) : (
          <p className="mt-4 text-[var(--color-text-muted)]">No projects yet — create one to begin.</p>
        )}
      </div>
    </div>
  );
}
