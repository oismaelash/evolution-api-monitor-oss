import { describe, it, expect, beforeEach, beforeAll, vi } from 'vitest';
import { prisma } from '@monitor/database';
import { createHealthCheckWorker, processHealthCheck } from './health-check.js';
import { EvolutionClient, resetEnvCacheForTests } from '@monitor/shared';
import { Queue, QueueEvents } from 'bullmq';
import { Redis } from 'ioredis';
import { encryptProjectSecret } from '../decrypt.js';

vi.mock('@monitor/shared', async (importOriginal) => {
  const actual = await importOriginal<any>();
  return {
    ...actual,
    EvolutionClient: vi.fn().mockImplementation(() => {
      return {
        checkHealth: vi.fn().mockResolvedValue({ ok: true, responseTimeMs: 100, raw: {} }),
      };
    }),
  };
});

vi.mock('../decrypt.js', async (importOriginal) => {
  const actual = await importOriginal<any>();
  return {
    ...actual,
    decryptProjectSecret: vi.fn().mockReturnValue('decrypted-secret'),
  };
});

describe('Worker: Health Check Job', () => {
  let userId: string;
  let projectId: string;
  let numberId: string;

  beforeAll(async () => {
    process.env.ENCRYPTION_KEY = 'a'.repeat(64);
    resetEnvCacheForTests();
    const user = await prisma.user.create({
      data: { email: 'hc_test@example.com', name: 'HC Test' },
    });
    userId = user.id;
    const project = await prisma.project.create({
      data: {
        userId: user.id,
        name: 'HC Project',
        evolutionUrl: 'http://test-evo.com',
        evolutionApiKey: encryptProjectSecret('secret'),
        evolutionFlavor: 'EVOLUTION_V2',
        config: { create: { pingInterval: 60, maxRetries: 2, retryDelay: 5, retryStrategy: 'FIXED' } },
      },
    });
    projectId = project.id;
  });

  beforeEach(async () => {
    resetEnvCacheForTests();
    delete process.env.CLOUD_BILLING;
    delete process.env.CLOUD_EXPONENTIAL_RETRY;
    await prisma.subscription.deleteMany({ where: { userId } });
    await prisma.alert.deleteMany();
    await prisma.log.deleteMany();
    await prisma.healthCheck.deleteMany();
    await prisma.number.deleteMany();

    const num = await prisma.number.create({
      data: {
        projectId,
        instanceName: 'test-hc-instance',
        state: 'ERROR',
        monitored: true,
        failureCount: 0,
        restartAttempts: 0,
      } as any,
    });
    numberId = num.id;
  });

  it('updates state to CONNECTED on successful check', async () => {
    vi.mocked(EvolutionClient).mockImplementation(() => {
      return { checkHealth: vi.fn().mockResolvedValue({ ok: true, responseTimeMs: 100, raw: {} }) } as any;
    });

    const job = { data: { numberId }, id: 'job-ok-1' } as any;
    const connection = new Redis(process.env.REDIS_URL!, { maxRetriesPerRequest: null });
    await processHealthCheck(job, connection as any);
    await connection.quit();

    const updated = await prisma.number.findUnique({ where: { id: numberId } });
    expect(updated?.state).toBe('CONNECTED');
  });

  it('updates state to DISCONNECTED and increments failure count', async () => {
    vi.mocked(EvolutionClient).mockImplementation(() => {
      return {
        checkHealth: vi.fn().mockResolvedValue({ ok: false, errorType: 'NETWORK_ERROR', message: 'fail', raw: {} }),
      } as any;
    });

    const job = { data: { numberId }, id: 'job-fail-1' } as any;
    const connection = new Redis(process.env.REDIS_URL!, { maxRetriesPerRequest: null });
    await processHealthCheck(job, connection as any);
    await connection.quit();

    const updated = await prisma.number.findUnique({ where: { id: numberId } });
    expect(updated?.state).toBe('DISCONNECTED');
    expect(updated?.failureCount).toBe(1);
  });

  it('enqueues alert-resolved when recovering after alert', async () => {
    const addSpy = vi.spyOn(Queue.prototype, 'add').mockResolvedValue({} as any);
    await prisma.number.update({
      where: { id: numberId },
      data: { lastAlertSentAt: new Date(), lastHealthyAt: new Date(Date.now() - 60_000) },
    });

    vi.mocked(EvolutionClient).mockImplementation(() => {
      return { checkHealth: vi.fn().mockResolvedValue({ ok: true, responseTimeMs: 100, raw: {} }) } as any;
    });

    const job = { data: { numberId }, id: 'job-resolve-1' } as any;
    const connection = new Redis(process.env.REDIS_URL!, { maxRetriesPerRequest: null });
    await processHealthCheck(job, connection as any);
    await connection.quit();

    expect(addSpy.mock.calls.some((c) => c[0] === 'alert-resolved')).toBe(true);
  });

  it('marks ERROR and enqueues alert on AUTH_ERROR', async () => {
    const addSpy = vi.spyOn(Queue.prototype, 'add').mockResolvedValue({} as any);
    vi.mocked(EvolutionClient).mockImplementation(() => {
      return { checkHealth: vi.fn().mockResolvedValue({ ok: false, errorType: 'AUTH_ERROR', message: 'auth', raw: {} }) } as any;
    });

    const job = { data: { numberId }, id: 'job-auth-1' } as any;
    const connection = new Redis(process.env.REDIS_URL!, { maxRetriesPerRequest: null });
    await processHealthCheck(job, connection as any);
    await connection.quit();

    expect(addSpy.mock.calls.some((c) => c[0] === 'alert')).toBe(true);
    const updated = await prisma.number.findUnique({ where: { id: numberId } });
    expect(updated?.state).toBe('ERROR');
  });

  it('handles INSTANCE_NOT_FOUND and enqueues alert', async () => {
    const addSpy = vi.spyOn(Queue.prototype, 'add').mockResolvedValue({} as any);
    vi.mocked(EvolutionClient).mockImplementation(() => {
      return { checkHealth: vi.fn().mockResolvedValue({ ok: false, errorType: 'INSTANCE_NOT_FOUND', message: 'missing', raw: {} }) } as any;
    });

    const job = { data: { numberId }, id: 'job-nf-1' } as any;
    const connection = new Redis(process.env.REDIS_URL!, { maxRetriesPerRequest: null });
    await processHealthCheck(job, connection as any);
    await connection.quit();

    expect(addSpy.mock.calls.some((c) => c[0] === 'alert')).toBe(true);
  });

  it('enqueues alert on first failure for Evolution Go', async () => {
    const addSpy = vi.spyOn(Queue.prototype, 'add').mockResolvedValue({} as any);
    await prisma.project.update({ where: { id: projectId }, data: { evolutionFlavor: 'EVOLUTION_GO' } });
    vi.mocked(EvolutionClient).mockImplementation(() => {
      return { checkHealth: vi.fn().mockResolvedValue({ ok: false, errorType: 'NETWORK_ERROR', message: 'fail', raw: {} }) } as any;
    });

    const job = { data: { numberId }, id: 'job-go-1' } as any;
    const connection = new Redis(process.env.REDIS_URL!, { maxRetriesPerRequest: null });
    await processHealthCheck(job, connection as any);
    await connection.quit();
    await prisma.project.update({ where: { id: projectId }, data: { evolutionFlavor: 'EVOLUTION_V2' } });

    expect(addSpy.mock.calls.some((c) => c[0] === 'alert')).toBe(true);
  });

  it('fast restarts when connection closed-like before threshold', async () => {
    const addSpy = vi.spyOn(Queue.prototype, 'add').mockResolvedValue({} as any);
    vi.mocked(EvolutionClient).mockImplementation(() => {
      return { checkHealth: vi.fn().mockResolvedValue({ ok: false, errorType: 'NETWORK_ERROR', message: 'connection closed', raw: {} }) } as any;
    });

    const job = { data: { numberId }, id: 'job-closed-1' } as any;
    const connection = new Redis(process.env.REDIS_URL!, { maxRetriesPerRequest: null });
    await processHealthCheck(job, connection as any);
    await connection.quit();

    expect(addSpy.mock.calls.some((c) => c[0] === 'restart')).toBe(true);
  });

  it('enqueues restart when failure threshold reached', async () => {
    const addSpy = vi.spyOn(Queue.prototype, 'add').mockResolvedValue({} as any);
    await prisma.number.update({ where: { id: numberId }, data: { failureCount: 9 } });
    vi.mocked(EvolutionClient).mockImplementation(() => {
      return { checkHealth: vi.fn().mockResolvedValue({ ok: false, errorType: 'NETWORK_ERROR', message: 'fail', raw: {} }) } as any;
    });

    const job = { data: { numberId }, id: 'job-threshold-1' } as any;
    const connection = new Redis(process.env.REDIS_URL!, { maxRetriesPerRequest: null });
    await processHealthCheck(job, connection as any);
    await connection.quit();

    expect(addSpy.mock.calls.some((c) => c[0] === 'restart')).toBe(true);
  });

  it('enqueues alert when max restart retries reached', async () => {
    const addSpy = vi.spyOn(Queue.prototype, 'add').mockResolvedValue({} as any);
    await prisma.projectConfig.update({ where: { projectId }, data: { maxRetries: 1 } as any });
    await prisma.number.update({ where: { id: numberId }, data: { restartAttempts: 1, failureCount: 2 } });
    vi.mocked(EvolutionClient).mockImplementation(() => {
      return { checkHealth: vi.fn().mockResolvedValue({ ok: false, errorType: 'NETWORK_ERROR', message: 'fail', raw: {} }) } as any;
    });

    const job = { data: { numberId }, id: 'job-max-1' } as any;
    const connection = new Redis(process.env.REDIS_URL!, { maxRetriesPerRequest: null });
    await processHealthCheck(job, connection as any);
    await connection.quit();

    expect(addSpy.mock.calls.some((c) => c[0] === 'alert')).toBe(true);
  });

  it('uses exponential jitter when enabled', async () => {
    process.env.CLOUD_EXPONENTIAL_RETRY = 'true';
    resetEnvCacheForTests();
    const addSpy = vi.spyOn(Queue.prototype, 'add').mockResolvedValue({} as any);
    const rand = Math.random;
    Math.random = () => 0;
    await prisma.number.update({ where: { id: numberId }, data: { failureCount: 2 } });
    vi.mocked(EvolutionClient).mockImplementation(() => {
      return { checkHealth: vi.fn().mockResolvedValue({ ok: false, errorType: 'NETWORK_ERROR', message: 'fail', raw: {} }) } as any;
    });

    const job = { data: { numberId }, id: 'job-jitter-1' } as any;
    const connection = new Redis(process.env.REDIS_URL!, { maxRetriesPerRequest: null });
    await processHealthCheck(job, connection as any);
    await connection.quit();
    Math.random = rand;

    expect(addSpy.mock.calls.some((c) => c[0] === 'restart')).toBe(true);
  });

  it('skips health checks when billing is unpaid', async () => {
    process.env.CLOUD_BILLING = 'true';
    resetEnvCacheForTests();
    await prisma.subscription.create({ data: { userId, status: 'UNPAID' as any } });

    const job = { data: { numberId }, id: 'job-bill-unpaid-1' } as any;
    const connection = new Redis(process.env.REDIS_URL!, { maxRetriesPerRequest: null });
    await processHealthCheck(job, connection as any);
    await connection.quit();

    const rows = await prisma.healthCheck.findMany({ where: { numberId } });
    expect(rows.length).toBe(0);
  });

  it('skips health checks when subscription is canceled and period ended', async () => {
    process.env.CLOUD_BILLING = 'true';
    resetEnvCacheForTests();
    await prisma.subscription.create({
      data: { userId, status: 'CANCELED' as any, currentPeriodEnd: new Date(Date.now() - 60_000) },
    });

    const job = { data: { numberId }, id: 'job-bill-canceled-1' } as any;
    const connection = new Redis(process.env.REDIS_URL!, { maxRetriesPerRequest: null });
    await processHealthCheck(job, connection as any);
    await connection.quit();

    const rows = await prisma.healthCheck.findMany({ where: { numberId } });
    expect(rows.length).toBe(0);
  });

  it('skips health checks when subscription is past due and grace ended', async () => {
    process.env.CLOUD_BILLING = 'true';
    resetEnvCacheForTests();
    await prisma.subscription.create({
      data: { userId, status: 'PAST_DUE' as any, pastDueGraceEndsAt: new Date(Date.now() - 60_000) },
    });

    const job = { data: { numberId }, id: 'job-bill-pastdue-1' } as any;
    const connection = new Redis(process.env.REDIS_URL!, { maxRetriesPerRequest: null });
    await processHealthCheck(job, connection as any);
    await connection.quit();

    const rows = await prisma.healthCheck.findMany({ where: { numberId } });
    expect(rows.length).toBe(0);
  });

  it('does not skip billing when subscription is active', async () => {
    process.env.CLOUD_BILLING = 'true';
    resetEnvCacheForTests();
    await prisma.subscription.create({ data: { userId, status: 'ACTIVE' as any } });

    const job = { data: { numberId }, id: 'job-bill-active-1' } as any;
    const connection = new Redis(process.env.REDIS_URL!, { maxRetriesPerRequest: null });
    await processHealthCheck(job, connection as any);
    await connection.quit();

    const rows = await prisma.healthCheck.findMany({ where: { numberId } });
    expect(rows.length).toBe(1);
  });

  it('does not skip billing when no subscription exists', async () => {
    process.env.CLOUD_BILLING = 'true';
    resetEnvCacheForTests();
    await prisma.subscription.deleteMany({ where: { userId } });

    const job = { data: { numberId }, id: 'job-bill-nosub-1' } as any;
    const connection = new Redis(process.env.REDIS_URL!, { maxRetriesPerRequest: null });
    await processHealthCheck(job, connection as any);
    await connection.quit();

    const rows = await prisma.healthCheck.findMany({ where: { numberId } });
    expect(rows.length).toBe(1);
  });

  it('skips when lock is busy', async () => {
    const blocker = new Redis(process.env.REDIS_URL!, { maxRetriesPerRequest: null });
    await blocker.set(`number:${numberId}:lock`, 'held', 'EX', 60);
    await blocker.quit();

    const job = { data: { numberId }, id: 'job-lock-1' } as any;
    const connection = new Redis(process.env.REDIS_URL!, { maxRetriesPerRequest: null });
    await processHealthCheck(job, connection as any);
    await connection.quit();

    const rows = await prisma.healthCheck.findMany({ where: { numberId } });
    expect(rows.length).toBe(0);
  });

  it('skips when number is not monitored', async () => {
    const user = await prisma.user.create({
      data: { email: 'hc_nomonitor@example.com', name: 'HC NoMonitor' },
    });
    const project = await prisma.project.create({
      data: {
        userId: user.id,
        name: 'NoMonitor',
        evolutionUrl: 'http://test-evo.com',
        evolutionApiKey: encryptProjectSecret('secret'),
        evolutionFlavor: 'EVOLUTION_V2',
        config: { create: { pingInterval: 60, maxRetries: 2, retryDelay: 5, retryStrategy: 'FIXED' } },
      },
    });
    const num = await prisma.number.create({
      data: { projectId: project.id, instanceName: 'n', monitored: false, state: 'ERROR' },
    });

    const job = { data: { numberId: num.id }, id: 'job-nomonitor-1' } as any;
    const connection = new Redis(process.env.REDIS_URL!, { maxRetriesPerRequest: null });
    await processHealthCheck(job, connection as any);
    await connection.quit();

    const rows = await prisma.healthCheck.findMany({ where: { numberId: num.id } });
    expect(rows.length).toBe(0);
  });

  it('maps rate limit errors and continues flow', async () => {
    const addSpy = vi.spyOn(Queue.prototype, 'add').mockResolvedValue({} as any);
    await prisma.number.update({ where: { id: numberId }, data: { failureCount: 2 } });
    vi.mocked(EvolutionClient).mockImplementation(() => {
      return { checkHealth: vi.fn().mockResolvedValue({ ok: false, errorType: 'RATE_LIMIT', message: 'rate', raw: {} }) } as any;
    });

    const job = { data: { numberId }, id: 'job-rate-1' } as any;
    const connection = new Redis(process.env.REDIS_URL!, { maxRetriesPerRequest: null });
    await processHealthCheck(job, connection as any);
    await connection.quit();

    expect(addSpy.mock.calls.some((c) => c[0] === 'restart')).toBe(true);
  });

  it('maps unknown errors and continues flow', async () => {
    const addSpy = vi.spyOn(Queue.prototype, 'add').mockResolvedValue({} as any);
    await prisma.number.update({ where: { id: numberId }, data: { failureCount: 2 } });
    vi.mocked(EvolutionClient).mockImplementation(() => {
      return { checkHealth: vi.fn().mockResolvedValue({ ok: false, errorType: 'SOMETHING_ELSE', message: 'unknown', raw: {} }) } as any;
    });

    const job = { data: { numberId }, id: 'job-unknown-1' } as any;
    const connection = new Redis(process.env.REDIS_URL!, { maxRetriesPerRequest: null });
    await processHealthCheck(job, connection as any);
    await connection.quit();

    expect(addSpy.mock.calls.some((c) => c[0] === 'restart')).toBe(true);
  });

  it('logs and returns when project config is missing', async () => {
    const user = await prisma.user.create({
      data: { email: 'hc_nocfg@example.com', name: 'HC NoCfg' },
    });
    const project = await prisma.project.create({
      data: {
        userId: user.id,
        name: 'NoCfg',
        evolutionUrl: 'http://test-evo.com',
        evolutionApiKey: encryptProjectSecret('secret'),
        evolutionFlavor: 'EVOLUTION_V2',
      },
    });
    const num = await prisma.number.create({
      data: { projectId: project.id, instanceName: 'n', monitored: true, state: 'ERROR' },
    });

    const job = { data: { numberId: num.id }, id: 'job-nocfg-1' } as any;
    const connection = new Redis(process.env.REDIS_URL!, { maxRetriesPerRequest: null });
    await processHealthCheck(job, connection as any);
    await connection.quit();

    const rows = await prisma.healthCheck.findMany({ where: { numberId: num.id } });
    expect(rows.length).toBe(0);
  });

  it('logs and rethrows when processing fails', async () => {
    const decrypt = await import('../decrypt.js');
    const spy = vi.spyOn(decrypt, 'decryptProjectSecret').mockImplementation(() => {
      throw new Error('decrypt boom');
    });
    const job = { data: { numberId }, id: 'job-throw-1' } as any;
    const connection = new Redis(process.env.REDIS_URL!, { maxRetriesPerRequest: null });
    try {
      await expect(processHealthCheck(job, connection as any)).rejects.toBeTruthy();
    } finally {
      await connection.quit();
      spy.mockRestore();
    }
  });

  it('creates and closes the bullmq worker', async () => {
    const connection = new Redis(process.env.REDIS_URL!, { maxRetriesPerRequest: null });
    const w = createHealthCheckWorker(connection as any);
    await w.close();
    await connection.quit();
  });

  it('processes a health-check job through bullmq worker', async () => {
    vi.restoreAllMocks();
    vi.mocked(EvolutionClient).mockImplementation(() => {
      return { checkHealth: vi.fn().mockResolvedValue({ ok: true, responseTimeMs: 100, raw: {} }) } as any;
    });

    const connection = new Redis(process.env.REDIS_URL!, { maxRetriesPerRequest: null });
    const worker = createHealthCheckWorker(connection as any);
    const queue = new Queue('health-check', { connection: connection as any });
    const events = new QueueEvents('health-check', { connection: connection as any });

    await events.waitUntilReady();
    const job = await queue.add('health-check', { numberId }, { removeOnComplete: true });
    await (job as any).waitUntilFinished(events);

    await worker.close();
    await events.close();
    await queue.close();
    await connection.quit();
  });
});
