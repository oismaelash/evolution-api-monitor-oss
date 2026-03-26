import { describe, it, expect, beforeAll, beforeEach, vi } from 'vitest';
import { prisma } from '@monitor/database';
import { encryptForStorage } from '@/lib/encryption';
import { EvolutionClient, resetEnvCacheForTests } from '@monitor/shared';
import { DashboardService } from '@/services/dashboard.service';
import { LogService } from '@/services/log.service';

vi.mock('next/server', () => {
  return {
    NextRequest: class {},
    NextResponse: {
      json: (body: any, init?: any) => {
        return {
          status: init?.status || 200,
          json: async () => body,
        };
      },
    },
  };
});

vi.mock('@/lib/queues', () => {
  return {
    upsertHealthSchedule: vi.fn().mockResolvedValue(undefined),
    removeHealthSchedule: vi.fn().mockResolvedValue(undefined),
    enqueueImmediateHealthCheck: vi.fn().mockResolvedValue(undefined),
    enqueueManualRestart: vi.fn().mockResolvedValue(undefined),
  };
});

async function ensureOssUser(role: 'USER' | 'ADMIN' = 'USER') {
  const userId = 'oss-user-id';
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    await prisma.user.create({ data: { id: userId, email: 'oss_user@example.com', role } as any });
    return;
  }
  if ((user as any).role !== role) {
    await prisma.user.update({ where: { id: userId }, data: { role } as any });
  }
}

async function resetDb() {
  await prisma.alert.deleteMany();
  await prisma.healthCheck.deleteMany();
  await prisma.log.deleteMany();
  await prisma.number.deleteMany();
  await prisma.projectConfig.deleteMany();
  await prisma.project.deleteMany();
}

describe('API routes coverage', () => {
  beforeAll(async () => {
    process.env.ENCRYPTION_KEY = 'a'.repeat(64);
    await ensureOssUser('USER');
  });

  beforeEach(async () => {
    resetEnvCacheForTests();
    await resetDb();
    vi.restoreAllMocks();
  });

  it('POST /api/projects handles ok and bad payload', async () => {
    const { GET, POST } = await import('./projects/route');
    const resList = await GET({ nextUrl: { searchParams: new URLSearchParams() } } as any);
    expect(resList.status).toBe(200);

    const resBad = await POST({ json: async () => ({}) } as any);
    expect(resBad.status).toBe(400);

    const resOk = await POST({
      json: async () => ({
        name: 'P',
        evolutionUrl: 'http://x',
        evolutionApiKey: 'k',
        evolutionFlavor: 'EVOLUTION_V2',
      }),
    } as any);
    expect(resOk.status).toBe(201);
  });

  it('GET /api/dashboard/overview returns 500 when service fails', async () => {
    const { GET } = await import('./dashboard/overview/route');
    vi.spyOn(DashboardService, 'getOverview').mockRejectedValue(new Error('boom'));
    const res = await GET();
    expect(res.status).toBe(500);
  });

  it('GET /api/logs returns 500 when service fails', async () => {
    const { GET } = await import('./logs/route');
    vi.spyOn(LogService, 'listGlobal').mockRejectedValue(new Error('boom'));
    const req = { nextUrl: { searchParams: new URLSearchParams() } } as any;
    const res = await GET(req);
    expect(res.status).toBe(500);
  });

  it('GET /api/projects returns 500 on malformed req', async () => {
    const { GET } = await import('./projects/route');
    const res = await GET({ nextUrl: {} } as any);
    expect(res.status).toBe(500);
  });

  it('POST /api/alerts/[alertId]/acknowledge acknowledges or 404', async () => {
    const { POST } = await import('./alerts/[alertId]/acknowledge/route');

    const project = await prisma.project.create({
      data: { userId: 'oss-user-id', name: 'P1', evolutionUrl: 'http://x', evolutionApiKey: '123', config: { create: {} } },
    });
    const number = await prisma.number.create({ data: { projectId: project.id, instanceName: 'i1', monitored: true } });
    const alert = await prisma.alert.create({ data: { numberId: number.id, channel: 'EMAIL' as any, payload: {} as any } });

    const res = await POST({} as any, { params: Promise.resolve({ alertId: alert.id }) } as any);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.acknowledgedAt).toBeTruthy();

    const res404 = await POST({} as any, { params: Promise.resolve({ alertId: 'missing' }) } as any);
    expect(res404.status).toBe(404);
  });

  it('GET /api/dashboard/overview returns payload', async () => {
    const { GET } = await import('./dashboard/overview/route');
    const project = await prisma.project.create({
      data: { userId: 'oss-user-id', name: 'Dash', evolutionUrl: 'http://x', evolutionApiKey: '123', config: { create: {} } },
    });
    const n1 = await prisma.number.create({ data: { projectId: project.id, instanceName: 'n1', state: 'CONNECTED' as any, monitored: true } });
    const n2 = await prisma.number.create({ data: { projectId: project.id, instanceName: 'n2', state: 'ERROR' as any, monitored: true } });
    await prisma.healthCheck.createMany({
      data: [
        { numberId: n1.id, status: 'HEALTHY' as any, checkedAt: new Date() } as any,
        { numberId: n1.id, status: 'UNHEALTHY' as any, checkedAt: new Date() } as any,
      ],
    });
    await prisma.alert.create({ data: { numberId: n2.id, channel: 'EMAIL' as any, payload: {} as any } });
    const res = await GET();
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.chartBuckets.length).toBe(24);
  });

  it('GET /api/logs lists logs', async () => {
    const { GET } = await import('./logs/route');
    const project = await prisma.project.create({
      data: { userId: 'oss-user-id', name: 'Logs', evolutionUrl: 'http://x', evolutionApiKey: '123', config: { create: {} } },
    });
    await prisma.log.createMany({
      data: [
        { projectId: project.id, level: 'INFO' as any, event: 'a' } as any,
        { projectId: project.id, level: 'ERROR' as any, event: 'b' } as any,
      ],
    });
    const req = { nextUrl: { searchParams: new URLSearchParams() } } as any;
    const res = await GET(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.data.length).toBe(2);
  });

  it('GET/PATCH/DELETE /api/projects/[projectId] works and covers 404/400', async () => {
    const { GET, PATCH, DELETE } = await import('./projects/[projectId]/route');
    const project = await prisma.project.create({
      data: { userId: 'oss-user-id', name: 'Proj', evolutionUrl: 'http://x', evolutionApiKey: '123', config: { create: {} } },
    });
    await prisma.number.create({ data: { projectId: project.id, instanceName: 'n1', monitored: true } });

    const resGet = await GET({} as any, { params: Promise.resolve({ projectId: project.id }) } as any);
    expect(resGet.status).toBe(200);

    const resPatch = await PATCH({ json: async () => ({ name: 'Proj2' }) } as any, { params: Promise.resolve({ projectId: project.id }) } as any);
    expect(resPatch.status).toBe(200);

    const resPatchBad = await PATCH({ json: async () => ({ evolutionUrl: 'bad' }) } as any, { params: Promise.resolve({ projectId: project.id }) } as any);
    expect(resPatchBad.status).toBe(400);

    const resDel = await DELETE({} as any, { params: Promise.resolve({ projectId: project.id }) } as any);
    expect(resDel.status).toBe(200);

    const resGet404 = await GET({} as any, { params: Promise.resolve({ projectId: 'missing' }) } as any);
    expect(resGet404.status).toBe(404);

    const resDel404 = await DELETE({} as any, { params: Promise.resolve({ projectId: 'missing' }) } as any);
    expect(resDel404.status).toBe(404);
  });

  it('PUT /api/projects/[projectId]/config upserts and validates', async () => {
    const { PUT } = await import('./projects/[projectId]/config/route');
    const project = await prisma.project.create({
      data: { userId: 'oss-user-id', name: 'Cfg', evolutionUrl: 'http://x', evolutionApiKey: '123', config: { create: {} } },
    });
    const resOk = await PUT({ json: async () => ({ pingInterval: 60, alertChannels: ['EMAIL'], alertEmail: 'a@b.com' }) } as any, {
      params: Promise.resolve({ projectId: project.id }),
    } as any);
    expect(resOk.status).toBe(200);

    const resBad = await PUT({ json: async () => ({ pingInterval: 'x' }) } as any, { params: Promise.resolve({ projectId: project.id }) } as any);
    expect(resBad.status).toBe(400);
  });

  it('GET/POST /api/projects/[projectId]/numbers lists and adds', async () => {
    const { GET, POST } = await import('./projects/[projectId]/numbers/route');
    const project = await prisma.project.create({
      data: { userId: 'oss-user-id', name: 'Nums', evolutionUrl: 'http://x', evolutionApiKey: '123', config: { create: { pingInterval: 300 } } },
    });
    const resList = await GET({ nextUrl: { searchParams: new URLSearchParams() } } as any, { params: Promise.resolve({ projectId: project.id }) } as any);
    expect(resList.status).toBe(200);

    const resAdd = await POST({ json: async () => ({ instanceName: 'inst-1', monitored: true }) } as any, {
      params: Promise.resolve({ projectId: project.id }),
    } as any);
    expect(resAdd.status).toBe(201);

    const resBad = await POST({ json: async () => ({}) } as any, { params: Promise.resolve({ projectId: project.id }) } as any);
    expect(resBad.status).toBe(400);
  });

  it('GET /api/projects/[projectId]/numbers returns 500 on malformed request', async () => {
    const { GET } = await import('./projects/[projectId]/numbers/route');
    const res = await GET({ nextUrl: {} } as any, { params: Promise.resolve({ projectId: 'x' }) } as any);
    expect(res.status).toBe(500);
  });

  it('GET/POST /api/projects/[projectId]/numbers/sync previews, validates and applies', async () => {
    const { GET, POST } = await import('./projects/[projectId]/numbers/sync/route');
    vi.spyOn(EvolutionClient.prototype as any, 'fetchInstances').mockResolvedValue([{ instanceName: 'a' }, { instanceName: 'b' }] as any);

    const project = await prisma.project.create({
      data: {
        userId: 'oss-user-id',
        name: 'Sync',
        evolutionUrl: 'http://x',
        evolutionApiKey: encryptForStorage('k'),
        evolutionFlavor: 'EVOLUTION_V2' as any,
        config: { create: { pingInterval: 300 } },
      },
    });
    await prisma.number.create({ data: { projectId: project.id, instanceName: 'a', monitored: true } });

    const resPreview = await GET({} as any, { params: Promise.resolve({ projectId: project.id }) } as any);
    expect(resPreview.status).toBe(200);

    const resBad = await POST({ json: async () => ({ instanceNames: 'x' }) } as any, { params: Promise.resolve({ projectId: project.id }) } as any);
    expect(resBad.status).toBe(400);

    const resApply = await POST({ json: async () => ({ instanceNames: ['b'] }) } as any, { params: Promise.resolve({ projectId: project.id }) } as any);
    expect(resApply.status).toBe(200);

    const resGet404 = await GET({} as any, { params: Promise.resolve({ projectId: 'missing' }) } as any);
    expect(resGet404.status).toBe(404);
  });

  it('POST /api/projects/[projectId]/numbers/sync returns 500 on params failure', async () => {
    const { POST } = await import('./projects/[projectId]/numbers/sync/route');
    const res = await POST(
      { json: async () => ({ instanceNames: ['a'] }) } as any,
      { params: Promise.reject(new Error('ctx fail')) } as any
    );
    expect(res.status).toBe(500);
  });

  it('GET /api/numbers/[numberId]/alerts lists and 404', async () => {
    const { GET } = await import('./numbers/[numberId]/alerts/route');
    const project = await prisma.project.create({
      data: { userId: 'oss-user-id', name: 'NA', evolutionUrl: 'http://x', evolutionApiKey: '123', config: { create: {} } },
    });
    const number = await prisma.number.create({ data: { projectId: project.id, instanceName: 'n1', monitored: true } });
    await prisma.alert.create({ data: { numberId: number.id, channel: 'EMAIL' as any, payload: {} as any } });

    const res = await GET({ nextUrl: { searchParams: new URLSearchParams() } } as any, { params: Promise.resolve({ numberId: number.id }) } as any);
    expect(res.status).toBe(200);
    const res404 = await GET({ nextUrl: { searchParams: new URLSearchParams() } } as any, { params: Promise.resolve({ numberId: 'missing' }) } as any);
    expect(res404.status).toBe(404);
  });

  it('GET /api/numbers/[numberId]/health-checks lists and 404', async () => {
    const { GET } = await import('./numbers/[numberId]/health-checks/route');
    const project = await prisma.project.create({
      data: { userId: 'oss-user-id', name: 'NH', evolutionUrl: 'http://x', evolutionApiKey: '123', config: { create: {} } },
    });
    const number = await prisma.number.create({ data: { projectId: project.id, instanceName: 'n1', monitored: true } });
    await prisma.healthCheck.create({ data: { numberId: number.id, status: 'HEALTHY' as any, checkedAt: new Date() } as any });

    const res = await GET({ nextUrl: { searchParams: new URLSearchParams() } } as any, { params: Promise.resolve({ numberId: number.id }) } as any);
    expect(res.status).toBe(200);
    const res404 = await GET({ nextUrl: { searchParams: new URLSearchParams() } } as any, { params: Promise.resolve({ numberId: 'missing' }) } as any);
    expect(res404.status).toBe(404);
  });

  it('POST /api/numbers/[numberId]/restart enqueues restart or errors', async () => {
    const { POST } = await import('./numbers/[numberId]/restart/route');
    const queues = await import('@/lib/queues');
    const project = await prisma.project.create({
      data: { userId: 'oss-user-id', name: 'NR', evolutionUrl: 'http://x', evolutionApiKey: '123', evolutionFlavor: 'EVOLUTION_V2' as any, config: { create: {} } },
    });
    const number = await prisma.number.create({ data: { projectId: project.id, instanceName: 'n1', monitored: true } });
    const resOk = await POST({} as any, { params: Promise.resolve({ numberId: number.id }) } as any);
    expect(resOk.status).toBe(200);
    expect(vi.mocked(queues.enqueueManualRestart).mock.calls.length).toBe(1);

    const res404 = await POST({} as any, { params: Promise.resolve({ numberId: 'missing' }) } as any);
    expect(res404.status).toBe(404);
  });

  it('GET /api/numbers/[numberId]/uptime validates period and returns 404', async () => {
    const { GET } = await import('./numbers/[numberId]/uptime/route');
    const project = await prisma.project.create({
      data: { userId: 'oss-user-id', name: 'NU', evolutionUrl: 'http://x', evolutionApiKey: '123', config: { create: {} } },
    });
    const number = await prisma.number.create({ data: { projectId: project.id, instanceName: 'n1', monitored: true } });
    await prisma.healthCheck.create({ data: { numberId: number.id, status: 'HEALTHY' as any, checkedAt: new Date() } as any });
    const req = { nextUrl: { searchParams: new URLSearchParams({ period: 'bad' }) } } as any;
    const res = await GET(req, { params: Promise.resolve({ numberId: number.id }) } as any);
    expect(res.status).toBe(200);

    const req7d = { nextUrl: { searchParams: new URLSearchParams({ period: '7d' }) } } as any;
    const res7d = await GET(req7d, { params: Promise.resolve({ numberId: number.id }) } as any);
    expect(res7d.status).toBe(200);

    const req404 = { nextUrl: { searchParams: new URLSearchParams() } } as any;
    const res404 = await GET(req404, { params: Promise.resolve({ numberId: 'missing' }) } as any);
    expect(res404.status).toBe(404);
  });

  it('GET /api/admin/queues is guarded and accepts query secret', async () => {
    const { GET } = await import('./admin/queues/route');
    process.env.BULL_BOARD_SECRET = 's';
    resetEnvCacheForTests();

    await ensureOssUser('USER');
    const resForbidden = await GET({ headers: { get: () => 's' }, nextUrl: { searchParams: new URLSearchParams() } } as any);
    expect(resForbidden.status).toBe(403);

    await ensureOssUser('ADMIN');
    const resOk = await GET({ headers: { get: () => null }, nextUrl: { searchParams: new URLSearchParams({ secret: 's' }) } } as any);
    expect(resOk.status).toBe(200);

    const resBadSecret = await GET({ headers: { get: () => null }, nextUrl: { searchParams: new URLSearchParams({ secret: 'x' }) } } as any);
    expect(resBadSecret.status).toBe(403);
  });

  it('GET/PATCH/DELETE /api/numbers/[numberId] works and covers errors', async () => {
    const { GET, PATCH, DELETE } = await import('./numbers/[numberId]/route');
    const project = await prisma.project.create({
      data: { userId: 'oss-user-id', name: 'NumRoute', evolutionUrl: 'http://x', evolutionApiKey: '123', config: { create: {} } },
    });
    const number = await prisma.number.create({ data: { projectId: project.id, instanceName: 'nr-1', monitored: true } });

    const resGet = await GET({} as any, { params: Promise.resolve({ numberId: number.id }) } as any);
    expect(resGet.status).toBe(200);

    const resPatch = await PATCH({ json: async () => ({ label: 'Renamed', monitored: false }) } as any, {
      params: Promise.resolve({ numberId: number.id }),
    } as any);
    expect(resPatch.status).toBe(200);

    const resPatchBad = await PATCH({ json: async () => ({ monitored: 'x' }) } as any, {
      params: Promise.resolve({ numberId: number.id }),
    } as any);
    expect(resPatchBad.status).toBe(400);

    const resDelete404 = await DELETE({} as any, { params: Promise.resolve({ numberId: 'missing' }) } as any);
    expect(resDelete404.status).toBe(404);

    const resDelete = await DELETE({} as any, { params: Promise.resolve({ numberId: number.id }) } as any);
    expect(resDelete.status).toBe(200);

    const resGet500 = await GET({} as any, { params: Promise.reject(new Error('ctx fail')) } as any);
    expect(resGet500.status).toBe(500);
  });

  it('POST /api/webhooks/pilot-status handles delivery states and failures', async () => {
    vi.resetModules();
    vi.doMock('@pilot-status/sdk', () => ({
      parseCustomerWebhook: (body: any) => body,
    }));
    const { POST } = await import('./webhooks/pilot-status/route');

    const project = await prisma.project.create({
      data: { userId: 'oss-user-id', name: 'Webhook', evolutionUrl: 'http://x', evolutionApiKey: '123', config: { create: {} } },
    });
    const number = await prisma.number.create({ data: { projectId: project.id, instanceName: 'wh-1', monitored: true } });
    const alert = await prisma.alert.create({
      data: { numberId: number.id, channel: 'MONITOR_STATUS' as any, payload: { pilotStatusId: 'msg-1' } as any },
    });

    const missingMessageId = await POST({ json: async () => ({ event: 'message.delivered', data: {} }) } as any);
    expect(missingMessageId.status).toBe(400);

    const notFound = await POST({
      json: async () => ({ event: 'message.delivered', data: { messageId: 'missing' } }),
    } as any);
    expect(notFound.status).toBe(200);

    const delivered = await POST({
      json: async () => ({ event: 'message.delivered', data: { messageId: 'msg-1' } }),
    } as any);
    expect(delivered.status).toBe(200);
    const deliveredRow = await prisma.alert.findUnique({ where: { id: alert.id } });
    expect(deliveredRow?.delivered).toBe(true);

    const failed = await POST({
      json: async () => ({ event: 'message.failed', data: { messageId: 'msg-1', errorMessage: 'provider down' } }),
    } as any);
    expect(failed.status).toBe(200);
    const failedRow = await prisma.alert.findUnique({ where: { id: alert.id } });
    expect(failedRow?.deliveryError).toBe('provider down');

    const failedUnknown = await POST({
      json: async () => ({ event: 'message.failed', data: { messageId: 'msg-1' } }),
    } as any);
    expect(failedUnknown.status).toBe(200);
    const failedUnknownRow = await prisma.alert.findUnique({ where: { id: alert.id } });
    expect(failedUnknownRow?.deliveryError).toBe('Unknown error');
  });

  it('POST /api/webhooks/pilot-status returns 500 on parse failures', async () => {
    vi.resetModules();
    vi.doMock('@pilot-status/sdk', () => ({
      parseCustomerWebhook: () => {
        throw new Error('parse boom');
      },
    }));
    const { POST } = await import('./webhooks/pilot-status/route');
    const res = await POST({ json: async () => ({}) } as any);
    expect(res.status).toBe(500);
  });
});
