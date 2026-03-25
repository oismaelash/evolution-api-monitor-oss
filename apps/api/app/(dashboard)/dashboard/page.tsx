import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { DashboardService } from '@/services/dashboard.service';
import { DashboardOverviewPolling } from '@/components/dashboard/dashboard-overview-polling';

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  const userId = session!.user!.id;
  const initialData = await DashboardService.getOverview(userId);

  return (
    <div>
      <h1 className="mb-2 text-2xl font-semibold">Dashboard</h1>
      <p className="mb-8 text-[var(--color-text-muted)]">Overview of monitored numbers.</p>
      <DashboardOverviewPolling initialData={initialData} />
    </div>
  );
}
