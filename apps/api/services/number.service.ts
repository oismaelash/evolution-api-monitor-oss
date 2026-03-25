import { prisma } from '@monitor/database';
import {
  AppError,
  EvolutionClient,
  EvolutionFlavor,
  addNumberSchema,
  buildPaginationMeta,
  parseEvolutionInstanceNames,
  updateNumberSchema,
} from '@monitor/shared';
import { decryptFromStorage } from '@/lib/encryption';
import { computeUptimeDisplayPercent } from '@/lib/uptime';

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

  /** Lists instances from Evolution and whether each is already registered on this project. */
  async previewSyncFromEvolution(userId: string, projectId: string) {
    const project = await prisma.project.findFirst({
      where: { id: projectId, userId },
    });
    if (!project) {
      throw new AppError('UNKNOWN', 'Project not found', 404);
    }
    const apiKey = decryptFromStorage(project.evolutionApiKey);
    const client = new EvolutionClient(project.evolutionUrl, apiKey, { flavor: project.evolutionFlavor });
    const raw = await client.fetchInstances();
    const names = parseEvolutionInstanceNames(raw);
    const existingRows =
      names.length === 0
        ? []
        : await prisma.number.findMany({
            where: { projectId, instanceName: { in: names } },
            select: { instanceName: true },
          });
    const existing = new Set(existingRows.map((r) => r.instanceName));
    const instances = [...names]
      .sort((a, b) => a.localeCompare(b))
      .map((instanceName) => ({
        instanceName,
        alreadyInProject: existing.has(instanceName),
      }));
    return { instances };
  },

  /** Creates Number rows for the given names (must appear in a fresh Evolution fetchInstances). */
  async applySyncFromEvolution(userId: string, projectId: string, instanceNames: string[]) {
    const project = await prisma.project.findFirst({
      where: { id: projectId, userId },
      include: { config: true },
    });
    if (!project) {
      throw new AppError('UNKNOWN', 'Project not found', 404);
    }
    const unique = [...new Set(instanceNames)];
    const apiKey = decryptFromStorage(project.evolutionApiKey);
    const client = new EvolutionClient(project.evolutionUrl, apiKey, { flavor: project.evolutionFlavor });
    const raw = await client.fetchInstances();
    const names = parseEvolutionInstanceNames(raw);
    const allowed = new Set(names);
    for (const instanceName of unique) {
      if (!allowed.has(instanceName)) {
        throw new AppError(
          'UNKNOWN',
          `Instance "${instanceName}" is not on Evolution (or was removed since you opened the list).`,
          400,
        );
      }
    }
    let created = 0;
    const createdIds: string[] = [];
    for (const instanceName of unique) {
      const existing = await prisma.number.findUnique({
        where: { projectId_instanceName: { projectId, instanceName } },
      });
      if (existing) continue;
      const row = await prisma.number.create({
        data: { projectId, instanceName, monitored: true },
      });
      createdIds.push(row.id);
      created += 1;
    }
    const cfg = project.config;
    const ping = cfg?.pingInterval ?? 300;
    const numbers = await prisma.number.findMany({
      where: { projectId },
      select: { id: true, monitored: true },
    });
    const { upsertHealthSchedule, enqueueImmediateHealthCheck } = await import('@/lib/queues');
    for (const n of numbers) {
      if (n.monitored) {
        await upsertHealthSchedule(n.id, ping);
      }
    }
    for (const id of createdIds) {
      await enqueueImmediateHealthCheck(id);
    }
    
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
      const { upsertHealthSchedule, enqueueImmediateHealthCheck } = await import('@/lib/queues');
      await upsertHealthSchedule(n.id, ping);
      await enqueueImmediateHealthCheck(n.id);
    }
    
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
    
    return updated;
  },

  async delete(userId: string, numberId: string) {
    await ensureNumberOwned(userId, numberId);
    const { removeHealthSchedule } = await import('@/lib/queues');
    await removeHealthSchedule(numberId);
    await prisma.number.delete({ where: { id: numberId } });
    
  },

  async restart(userId: string, numberId: string) {
    const n = await ensureNumberOwned(userId, numberId);
    if (n.project.evolutionFlavor === EvolutionFlavor.EVOLUTION_GO) {
      throw new AppError(
        'UNKNOWN',
        'Restart is not available for Evolution Go. Reconnect from your Evolution server if needed.',
        400,
      );
    }
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
    const n = await ensureNumberOwned(userId, numberId);
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
    const percent = computeUptimeDisplayPercent(healthy, unhealthy, n.state);
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
