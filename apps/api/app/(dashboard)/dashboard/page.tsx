import { getServerTranslator } from '@/lib/i18n-server';
import { DashboardService } from '@/services/dashboard.service';
import { DashboardOverviewPolling } from '@/components/dashboard/dashboard-overview-polling';

export default async function DashboardPage() {
  const t = await getServerTranslator();
  const userId = 'oss-user-id';
  
  const initialData = await DashboardService.getOverview(userId);

  return (
    <div>
      <h1 className="mb-2 text-2xl font-semibold">{t('Painel', 'Dashboard')}</h1>
      <p className="mb-8 text-[var(--color-text-muted)]">
        {t('Visão geral dos números monitorados.', 'Overview of monitored numbers.')}
      </p>
      <DashboardOverviewPolling initialData={initialData} />
    </div>
  );
}
