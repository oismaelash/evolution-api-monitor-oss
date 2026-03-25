import Link from 'next/link';
import { prisma } from '@monitor/database';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { CreateProjectForm } from '@/components/dashboard/create-project-form';
import { LocalDateTime } from '@/components/ui/local-datetime';

export default async function ProjectsPage() {
  const session = await getServerSession(authOptions);
  const userId = session!.user!.id;
  const projects = await prisma.project.findMany({
    where: { userId },
    orderBy: { updatedAt: 'desc' },
    include: {
      _count: { select: { numbers: true } },
    },
  });

  return (
    <div>
      <h1 className="mb-2 text-2xl font-semibold">Projects</h1>
      <p className="mb-8 text-[var(--color-text-muted)]" suppressHydrationWarning>
        Manage Evolution servers and monitored numbers. Create a project below, then open it to sync
        instances or add numbers manually.
      </p>

      <div className="mb-10">
        <CreateProjectForm />
      </div>

      <h2 className="mb-4 text-lg font-medium">Your projects</h2>
      <div className="overflow-hidden rounded-lg border border-[var(--color-border)]">
        <table className="w-full text-left text-sm">
          <thead className="bg-[var(--color-surface)] text-[var(--color-text-muted)]">
            <tr>
              <th className="px-4 py-2">Name</th>
              <th className="px-4 py-2">Numbers</th>
              <th className="px-4 py-2">Updated</th>
            </tr>
          </thead>
          <tbody>
            {projects.length === 0 ? (
              <tr>
                <td className="px-4 py-8 text-[var(--color-text-muted)]" colSpan={3}>
                  No projects yet. Use the form above to create one.
                </td>
              </tr>
            ) : (
              projects.map((p: (typeof projects)[number]) => (
                <tr key={p.id} className="border-t border-[var(--color-border)]">
                  <td className="px-4 py-2">
                    <Link
                      href={`/projects/${p.id}`}
                      className="font-medium text-[var(--color-accent)] hover:underline"
                    >
                      {p.name}
                    </Link>
                  </td>
                  <td className="px-4 py-2">{p._count.numbers}</td>
                  <td className="px-4 py-2 text-[var(--color-text-muted)]">
                    <LocalDateTime iso={p.updatedAt.toISOString()} />
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
