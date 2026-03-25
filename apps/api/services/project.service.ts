import { prisma } from '@monitor/database';
import {
  AppError,
  buildPaginationMeta,
  createProjectSchema,
  projectConfigSchema,
  updateProjectSchema,
  type AlertChannel,
  type CreateProjectInput,
  type ProjectConfigInput,
  type RetryStrategy,
  type UpdateProjectInput,
} from '@monitor/shared';
import { encryptForStorage } from '@/lib/encryption';
import { BillingSyncService } from '@/services/billing-sync.service';

async function ensureProjectOwned(userId: string, projectId: string) {
  const p = await prisma.project.findFirst({
    where: { id: projectId, userId },
  });
  if (!p) {
    throw new AppError('UNKNOWN', 'Project not found', 404);
  }
  return p;
}

export const ProjectService = {
  async list(userId: string, page: number, limit: number) {
    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      prisma.project.findMany({
        where: { userId },
        orderBy: { updatedAt: 'desc' },
        skip,
        take: limit,
        include: {
          _count: { select: { numbers: true } },
        },
      }),
      prisma.project.count({ where: { userId } }),
    ]);
    return { data, meta: buildPaginationMeta(page, limit, total) };
  },

  async create(userId: string, input: CreateProjectInput) {
    const parsed = createProjectSchema.parse(input);
    const project = await prisma.project.create({
      data: {
        userId,
        name: parsed.name,
        evolutionFlavor: parsed.evolutionFlavor,
        evolutionUrl: parsed.evolutionUrl,
        evolutionApiKey: encryptForStorage(parsed.evolutionApiKey),
        alertPhone: parsed.alertPhone,
        config: { create: {} },
      },
      include: { config: true },
    });
    return { ...project, evolutionApiKey: '***' };
  },

  async getById(userId: string, projectId: string) {
    await ensureProjectOwned(userId, projectId);
    const project = await prisma.project.findUniqueOrThrow({
      where: { id: projectId },
      include: { config: true, numbers: { take: 5 } },
    });
    return { ...project, evolutionApiKey: '***' };
  },

  async update(userId: string, projectId: string, input: UpdateProjectInput) {
    await ensureProjectOwned(userId, projectId);
    const parsed = updateProjectSchema.parse(input);
    const data: Record<string, unknown> = {};
    if (parsed.name !== undefined) data.name = parsed.name;
    if (parsed.evolutionFlavor !== undefined) data.evolutionFlavor = parsed.evolutionFlavor;
    if (parsed.evolutionUrl !== undefined) data.evolutionUrl = parsed.evolutionUrl;
    if (parsed.evolutionApiKey !== undefined) {
      data.evolutionApiKey = encryptForStorage(parsed.evolutionApiKey);
    }
    if (parsed.alertPhone !== undefined) data.alertPhone = parsed.alertPhone;
    const project = await prisma.project.update({
      where: { id: projectId },
      data: data as Record<string, never>,
      include: { config: true },
    });
    return { ...project, evolutionApiKey: '***' };
  },

  async delete(userId: string, projectId: string) {
    await ensureProjectOwned(userId, projectId);
    const numbers = await prisma.number.findMany({
      where: { projectId },
      select: { id: true },
    });
    const { removeHealthSchedule } = await import('@/lib/queues');
    for (const n of numbers) {
      await removeHealthSchedule(n.id);
    }
    await prisma.project.delete({ where: { id: projectId } });
    await BillingSyncService.syncActiveNumberCount(userId);
  },

  async upsertConfig(userId: string, projectId: string, input: ProjectConfigInput) {
    await ensureProjectOwned(userId, projectId);
    const parsed = projectConfigSchema.parse(input);
    const data: {
      pingInterval?: number;
      maxRetries?: number;
      retryDelay?: number;
      retryStrategy?: RetryStrategy;
      alertCooldown?: number;
      alertChannels?: AlertChannel[];
      alertTemplate?: string | null;
      alertEmail?: string | null;
      smtpFrom?: string | null;
      smtpHost?: string | null;
      smtpPort?: number | null;
      smtpUser?: string | null;
      smtpPass?: string | null;
      webhookUrl?: string | null;
      webhookSecret?: string | null;
    } = {};
    if (parsed.pingInterval !== undefined) data.pingInterval = parsed.pingInterval;
    if (parsed.maxRetries !== undefined) data.maxRetries = parsed.maxRetries;
    if (parsed.retryDelay !== undefined) data.retryDelay = parsed.retryDelay;
    if (parsed.retryStrategy !== undefined) {
      data.retryStrategy = parsed.retryStrategy as RetryStrategy;
    }
    if (parsed.alertCooldown !== undefined) data.alertCooldown = parsed.alertCooldown;
    if (parsed.alertChannels !== undefined) {
      data.alertChannels = parsed.alertChannels as AlertChannel[];
    }
    if (parsed.alertTemplate !== undefined) data.alertTemplate = parsed.alertTemplate;
    if (parsed.alertEmail !== undefined) data.alertEmail = parsed.alertEmail;
    if (parsed.smtpFrom !== undefined) data.smtpFrom = parsed.smtpFrom;
    if (parsed.smtpHost !== undefined) data.smtpHost = parsed.smtpHost;
    if (parsed.smtpPort !== undefined) data.smtpPort = parsed.smtpPort;
    if (parsed.smtpUser !== undefined) data.smtpUser = parsed.smtpUser;
    if (parsed.smtpPass !== undefined && parsed.smtpPass !== null) {
      data.smtpPass = encryptForStorage(parsed.smtpPass);
    }
    if (parsed.webhookUrl !== undefined) data.webhookUrl = parsed.webhookUrl;
    if (parsed.webhookSecret !== undefined && parsed.webhookSecret !== null) {
      data.webhookSecret = encryptForStorage(parsed.webhookSecret);
    }
    const cfg =
      Object.keys(data).length === 0
        ? await prisma.projectConfig.findUniqueOrThrow({ where: { projectId } })
        : await prisma.projectConfig.upsert({
            where: { projectId },
            create: {
              projectId,
              ...data,
            } as never,
            update: data as never,
          });
    const numbers = await prisma.number.findMany({
      where: { projectId, monitored: true },
      select: { id: true },
    });
    const { upsertHealthSchedule } = await import('@/lib/queues');
    for (const n of numbers) {
      await upsertHealthSchedule(n.id, cfg.pingInterval);
    }
    return cfg;
  },
};
