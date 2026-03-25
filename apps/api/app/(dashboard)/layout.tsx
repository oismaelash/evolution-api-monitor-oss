import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { DashboardShell } from '@/components/dashboard/dashboard-shell';
import { loadEnv } from '@monitor/shared';

export default async function DashboardGroupLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    redirect('/login');
  }
  const env = loadEnv();
  
  return (
    <DashboardShell
      userName={session.user.name ?? session.user.email}
      requiresDisplayName={session.user.requiresDisplayName === true}
      isBillingEnabled={env.CLOUD_BILLING}
    >
      {children}
    </DashboardShell>
  );
}
