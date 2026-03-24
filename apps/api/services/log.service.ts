import { prisma } from '@pilot/database';
import { buildPaginationMeta, parsePagination } from '@pilot/shared';

export const LogService = {
  async listGlobal(
    userId: string,
    searchParams: URLSearchParams
  ) {
    const { page, limit, skip } = parsePagination(searchParams);
    const numberId = searchParams.get('numberId') ?? undefined;
    const projectId = searchParams.get('projectId') ?? undefined;
    const level = searchParams.get('level') ?? undefined;

    const where = {
      AND: [
        {
          OR: [{ project: { userId } }, { number: { project: { userId } } }],
        },
        ...(numberId ? [{ numberId }] : []),
        ...(projectId ? [{ projectId }] : []),
        ...(level
          ? [{ level: level as 'DEBUG' | 'INFO' | 'WARN' | 'ERROR' }]
          : []),
      ],
    };

    const [data, total] = await Promise.all([
      prisma.log.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.log.count({ where }),
    ]);
    return { data, meta: buildPaginationMeta(page, limit, total) };
  },

  async listByProject(userId: string, projectId: string, page: number, limit: number) {
    const project = await prisma.project.findFirst({
      where: { id: projectId, userId },
    });
    if (!project) {
      return { data: [], meta: buildPaginationMeta(page, limit, 0) };
    }
    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      prisma.log.findMany({
        where: { projectId },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.log.count({ where: { projectId } }),
    ]);
    return { data, meta: buildPaginationMeta(page, limit, total) };
  },
};
