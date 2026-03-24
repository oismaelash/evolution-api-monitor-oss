import { prisma } from '@monitor/database';
import {
  AppError,
  EvolutionClient,
  addNumberSchema,
  buildPaginationMeta,
  updateNumberSchema,
} from '@monitor/shared';
import { decryptFromStorage } from '@/lib/encryption';
import { BillingSyncService } from '@/services/billing-sync.service';

async function ensureNumberOwned(userId: string, numberId: string) {
  const n = await prisma.number.findFirst({
    where: { id: numberId, project: { userId } },
    include: { project: { include: { config: true } } },
  });
  if (!n) {
    throw new AppError('UNKNOWN', 'Number not found', 404);
  }
  return n;
}

function parseInstanceNames(raw: unknown): string[] {
  const names: string[] = [];
  const pushName = (o: unknown) => {
    if (!o || typeof o !== 'object') return;
    const r = o as Record<string, unknown>;
    const n = r.instanceName ?? r.name;
    if (typeof n === 'string' && n.length > 0) names.push(n);
  };
  if (Array.isArray(raw)) {
    raw.forEach(pushName);
    return [...new Set(names)];
  }
  if (raw && typeof raw === 'object') {
    const r = raw as Record<string, unknown>;
    if (Array.isArray(r.instance)) {
      r.instance.forEach(pushName);
    }
    if (Array.isArray(r.instances)) {
      r.instances.forEach(pushName);
    }
    pushName(raw);
  }
  return [...new Set(names)];
}

export const NumberService = {
  async listByProject(userId: string, projectId: string, page: number, limit: number) {
    const project = await prisma.project.findFirst({
      where: { id: projectId, userId },
    });
    if (!project) {
      throw new AppError('UNKNOWN', 'Project not found', 404);
    }
    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      prisma.number.findMany({
        where: { projectId },
        orderBy: { updatedAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.number.count({ where: { projectId } }),
    ]);
    return { data, meta: buildPaginationMeta(page, limit, total) };
  },

  async syncFromEvolution(userId: string, projectId: string) {
    const project = await prisma.project.findFirst({
      where: { id: projectId, userId },
      include: { config: true },
    });
    if (!project) {
      throw new AppError('UNKNOWN', 'Project not found', 404);
    }
    const apiKey = decryptFromStorage(project.evolutionApiKey);
    const client = new EvolutionClient(project.evolutionUrl, apiKey);
    const raw = await client.fetchInstances();
    const names = parseInstanceNames(raw);
    let created = 0;
    for (const instanceName of names) {
      const existing = await prisma.number.findUnique({
        where: { projectId_instanceName: { projectId, instanceName } },
      });
      if (existing) continue;
      await prisma.number.create({
        data: { projectId, instanceName, monitored: true },
      });
      created += 1;
    }
    const cfg = project.config;
    const ping = cfg?.pingInterval ?? 300;
    const numbers = await prisma.number.findMany({
      where: { projectId },
      select: { id: true, monitored: true },
    });
    const { upsertHealthSchedule } = await import('@/lib/queues');
    for (const n of numbers) {
      if (n.monitored) {
        await upsertHealthSchedule(n.id, ping);
      }
    }
    await BillingSyncService.syncActiveNumberCount(userId);
    return { synced: names.length, created };
  },

  async addManual(userId: string, projectId: string, body: unknown) {
    const project = await prisma.project.findFirst({
      where: { id: projectId, userId },
      include: { config: true },
    });
    if (!project) {
      throw new AppError('UNKNOWN', 'Project not found', 404);
    }
    const parsed = addNumberSchema.parse(body);
    const n = await prisma.number.create({
      data: {
        projectId,
        instanceName: parsed.instanceName,
        phoneNumber: parsed.phoneNumber,
        label: parsed.label,
        monitored: parsed.monitored ?? true,
      },
      include: { project: true },
    });
    if (n.monitored) {
      const ping = project.config?.pingInterval ?? 300;
      const { upsertHealthSchedule } = await import('@/lib/queues');
      await upsertHealthSchedule(n.id, ping);
    }
    await BillingSyncService.syncActiveNumberCount(userId);
    return n;
  },

  async getById(userId: string, numberId: string) {
    return ensureNumberOwned(userId, numberId);
  },

  async update(userId: string, numberId: string, body: unknown) {
    const n = await ensureNumberOwned(userId, numberId);
    const parsed = updateNumberSchema.parse(body);
    const updated = await prisma.number.update({
      where: { id: numberId },
      data: {
        label: parsed.label ?? undefined,
        phoneNumber: parsed.phoneNumber ?? undefined,
        monitored: parsed.monitored !== undefined ? parsed.monitored : undefined,
      },
      include: { project: { include: { config: true } } },
    });
    const ping = updated.project.config?.pingInterval ?? 300;
    const { upsertHealthSchedule, removeHealthSchedule } = await import('@/lib/queues');
    if (updated.monitored) {
      await upsertHealthSchedule(updated.id, ping);
    } else {
      await removeHealthSchedule(updated.id);
    }
    await BillingSyncService.syncActiveNumberCount(userId);
    return updated;
  },

  async delete(userId: string, numberId: string) {
    await ensureNumberOwned(userId, numberId);
    const { removeHealthSchedule } = await import('@/lib/queues');
    await removeHealthSchedule(numberId);
    await prisma.number.delete({ where: { id: numberId } });
    await BillingSyncService.syncActiveNumberCount(userId);
  },

  async restart(userId: string, numberId: string) {
    await ensureNumberOwned(userId, numberId);
    const { enqueueManualRestart } = await import('@/lib/queues');
    await enqueueManualRestart(numberId);
    return { ok: true };
  },

  async listHealthChecks(userId: string, numberId: string, page: number, limit: number) {
    await ensureNumberOwned(userId, numberId);
    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      prisma.healthCheck.findMany({
        where: { numberId },
        orderBy: { checkedAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.healthCheck.count({ where: { numberId } }),
    ]);
    return { data, meta: buildPaginationMeta(page, limit, total) };
  },

  async uptime(userId: string, numberId: string, period: '24h' | '7d' | '30d') {
    await ensureNumberOwned(userId, numberId);
    const now = new Date();
    const ms =
      period === '24h' ? 24 * 60 * 60 * 1000 : period === '7d' ? 7 * 24 * 60 * 60 * 1000 : 30 * 24 * 60 * 60 * 1000;
    const from = new Date(now.getTime() - ms);
    const rows = await prisma.healthCheck.groupBy({
      by: ['status'],
      where: { numberId, checkedAt: { gte: from } },
      _count: { _all: true },
    });
    type Row = { status: string; _count: { _all: number } };
    const healthy = rows.find((r: Row) => r.status === 'HEALTHY')?._count._all ?? 0;
    const unhealthy = rows.find((r: Row) => r.status === 'UNHEALTHY')?._count._all ?? 0;
    const total = healthy + unhealthy;
    const percent = total === 0 ? 100 : Math.round((healthy / total) * 1000) / 10;
    return { period, healthy, unhealthy, total, percent };
  },

  async listAlerts(userId: string, numberId: string, page: number, limit: number) {
    await ensureNumberOwned(userId, numberId);
    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      prisma.alert.findMany({
        where: { numberId },
        orderBy: { sentAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.alert.count({ where: { numberId } }),
    ]);
    return { data, meta: buildPaginationMeta(page, limit, total) };
  },
};
