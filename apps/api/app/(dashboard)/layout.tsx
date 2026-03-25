import { DashboardShell } from '@/components/dashboard/dashboard-shell';
import { loadEnv } from '@monitor/shared';

export default async function DashboardGroupLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const env = loadEnv();
  
  return (
    <DashboardShell
      userName="OSS User"
      requiresDisplayName={false}
      isBillingEnabled={false}
    >
      {children}
    </DashboardShell>
  );
}
