import { describe, it, expect, beforeAll, beforeEach, vi } from 'vitest';
import { prisma } from '@monitor/database';
import { resetEnvCacheForTests } from '@monitor/shared';
import { Queue } from 'bullmq';
import { Redis } from 'ioredis';
import { encryptProjectSecret } from '../decrypt.js';
import { createRestartWorker, processRestartJob } from './restart.js';

describe('Worker: Restart Job', () => {
  let projectId: string;
  let numberId: string;

  beforeAll(async () => {
    process.env.ENCRYPTION_KEY = 'a'.repeat(64);
    resetEnvCacheForTests();
    const user = await prisma.user.create({
      data: { email: 'restart_test@example.com', name: 'Restart Test' },
    });
    const project = await prisma.project.create({
      data: {
        userId: user.id,
        name: 'Restart Project',
        evolutionUrl: 'http://test-evo.com',
        evolutionApiKey: encryptProjectSecret('secret'),
        evolutionFlavor: 'EVOLUTION_V2',
        config: { create: { retryDelay: 1 } },
      },
    });
    projectId = project.id;
  });

  beforeEach(async () => {
    resetEnvCacheForTests();
    await prisma.log.deleteMany();
    await prisma.number.deleteMany();
    const num = await prisma.number.create({
      data: {
        projectId,
        instanceName: 'test-restart-instance',
        state: 'CONNECTED',
        monitored: true,
        evolutionInstanceApiKey: encryptProjectSecret('instance-token'),
      },
    });
    numberId = num.id;
  });

  it('restarts instance, updates state, logs, and enqueues follow-up', async () => {
    const fetchSpy = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      text: async () => '',
    });
    (globalThis as any).fetch = fetchSpy;
    const addSpy = vi.spyOn(Queue.prototype, 'add').mockResolvedValue({} as any);

    const connection = new Redis(process.env.REDIS_URL!, { maxRetriesPerRequest: null });
    const job = { data: { numberId }, id: 'job-1' } as any;
    await processRestartJob(job, connection as any);
    await connection.quit();

    const updated = await prisma.number.findUnique({ where: { id: numberId } });
    expect(updated?.state).toBe('RESTARTING');
    expect(addSpy).toHaveBeenCalled();
    expect(fetchSpy).toHaveBeenCalledTimes(1);
    const restartInit = fetchSpy.mock.calls[0]?.[1] as RequestInit | undefined;
    expect(restartInit?.headers).toMatchObject({ apikey: 'instance-token' });
  });

  it('resolves instance token via fetchInstances when not stored, persists and restarts', async () => {
    await prisma.number.update({
      where: { id: numberId },
      data: { evolutionInstanceApiKey: null },
    });
    const fetchSpy = vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => [{ instanceName: 'test-restart-instance', token: 'resolved-tok' }],
        text: async () => '',
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        text: async () => '',
      });
    (globalThis as any).fetch = fetchSpy;
    vi.spyOn(Queue.prototype, 'add').mockResolvedValue({} as any);

    const connection = new Redis(process.env.REDIS_URL!, { maxRetriesPerRequest: null });
    const job = { data: { numberId }, id: 'job-resolve-1' } as any;
    await processRestartJob(job, connection as any);
    await connection.quit();

    const persisted = await prisma.number.findUnique({ where: { id: numberId } });
    expect(persisted?.evolutionInstanceApiKey).toBeTruthy();
    expect(fetchSpy).toHaveBeenCalledTimes(2);
    const restartInit = fetchSpy.mock.calls[1]?.[1] as RequestInit | undefined;
    expect(restartInit?.headers).toMatchObject({ apikey: 'resolved-tok' });
  });

  it('throws when instance token cannot be resolved', async () => {
    await prisma.number.update({
      where: { id: numberId },
      data: { evolutionInstanceApiKey: null },
    });
    (globalThis as any).fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => [{ instanceName: 'other', token: 'x' }],
      text: async () => '',
    });
    const connection = new Redis(process.env.REDIS_URL!, { maxRetriesPerRequest: null });
    const job = { data: { numberId }, id: 'job-noresolve-1' } as any;
    await expect(processRestartJob(job, connection as any)).rejects.toThrow(
      /Could not resolve Evolution per-instance token/,
    );
    await connection.quit();
  });

  it('skips when lock is busy', async () => {
    const blocker = new Redis(process.env.REDIS_URL!, { maxRetriesPerRequest: null });
    await blocker.set(`number:${numberId}:lock`, 'held', 'EX', 60);
    await blocker.quit();

    const addSpy = vi.spyOn(Queue.prototype, 'add').mockResolvedValue({} as any);
    const connection = new Redis(process.env.REDIS_URL!, { maxRetriesPerRequest: null });
    const job = { data: { numberId }, id: 'job-lock-1' } as any;
    await processRestartJob(job, connection as any);
    await connection.quit();

    expect(addSpy).not.toHaveBeenCalled();
  });

  it('logs and rethrows on restart failure', async () => {
    (globalThis as any).fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
      text: async () => 'fail',
    });
    const connection = new Redis(process.env.REDIS_URL!, { maxRetriesPerRequest: null });
    const job = { data: { numberId }, id: 'job-fail-1' } as any;
    await expect(processRestartJob(job, connection as any)).rejects.toBeTruthy();
    await connection.quit();
  });

  it('skips when number is not monitored', async () => {
    await prisma.number.update({ where: { id: numberId }, data: { monitored: false } });
    const connection = new Redis(process.env.REDIS_URL!, { maxRetriesPerRequest: null });
    const job = { data: { numberId }, id: 'job-unmonitored-1' } as any;
    await processRestartJob(job, connection as any);
    await connection.quit();
    const updated = await prisma.number.findUnique({ where: { id: numberId } });
    expect(updated?.state).toBe('CONNECTED');
  });

  it('skips restart for Evolution Go', async () => {
    await prisma.project.update({ where: { id: projectId }, data: { evolutionFlavor: 'EVOLUTION_GO' } as any });
    const connection = new Redis(process.env.REDIS_URL!, { maxRetriesPerRequest: null });
    const job = { data: { numberId }, id: 'job-go-1' } as any;
    await processRestartJob(job, connection as any);
    await connection.quit();
    const updated = await prisma.number.findUnique({ where: { id: numberId } });
    expect(updated?.state).toBe('CONNECTED');
    await prisma.project.update({ where: { id: projectId }, data: { evolutionFlavor: 'EVOLUTION_V2' } as any });
  });

  it('creates and closes the bullmq worker', async () => {
    const connection = new Redis(process.env.REDIS_URL!, { maxRetriesPerRequest: null });
    const worker = createRestartWorker(connection as any);
    await worker.close();
    await connection.quit();
  });
});
