import { Queue, Worker, type Job } from 'bullmq';
import { randomUUID } from 'node:crypto';
import { prisma } from '@monitor/database';
import {
  EvolutionClient,
  EvolutionFlavor,
  LogLevel,
  NumberState,
  getEvolutionTimeoutsMs,
} from '@monitor/shared';
import { acquireLock, releaseLock } from '../lock.js';
import type { RedisClient } from '../redis.js';
import { getRedis } from '../redis.js';
import { logJson } from '../logger.js';
import { decryptProjectSecret } from '../decrypt.js';

export type RestartJobData = { numberId: string };

const LOCK_TTL_SEC = 120;

export function createRestartWorker(connection: RedisClient) {
  return new Worker<RestartJobData>(
    'restart',
    async (job: Job<RestartJobData>) => processRestartJob(job, connection),
    { connection: connection as never }
  );
}

export async function processRestartJob(job: Job<RestartJobData>, connection: RedisClient) {
  const { numberId } = job.data;
  const redis = getRedis();
  const lockVal = randomUUID();
  const lockKey = `number:${numberId}:lock`;
  const got = await acquireLock(redis, lockKey, LOCK_TTL_SEC, lockVal);
  if (!got) {
    logJson('warn', 'restart_lock_busy', { numberId });
    return;
  }
  try {
    const number = await prisma.number.findUnique({
      where: { id: numberId },
      include: { project: { include: { config: true } } },
    });
    if (!number?.monitored || !number.project.config) {
      return;
    }
    if (number.project.evolutionFlavor === EvolutionFlavor.EVOLUTION_GO) {
      logJson('info', 'restart_skipped_evolution_go', { numberId });
      return;
    }
    const timeouts = getEvolutionTimeoutsMs();
    const apiKey = decryptProjectSecret(number.project.evolutionApiKey);
    const client = new EvolutionClient(number.project.evolutionUrl, apiKey, {
      ...timeouts,
      flavor: number.project.evolutionFlavor,
    });
    await client.restart(number.instanceName);
    await prisma.number.update({
      where: { id: numberId },
      data: { state: NumberState.RESTARTING as never },
    });
    await prisma.log.create({
      data: {
        numberId,
        projectId: number.projectId,
        level: LogLevel.INFO as never,
        event: 'restart_triggered',
        meta: {},
      },
    });
    const delayMs = number.project.config.retryDelay * 1000;
    const healthQueue = new Queue('health-check', { connection: connection as never });
    await healthQueue.add(
      'health-check',
      { numberId },
      { delay: delayMs, jobId: `health-followup:${numberId}:${Date.now()}` }
    );
  } catch (e) {
    const err = e as Error;
    logJson('error', 'restart_job_failed', { numberId, message: err.message });
    throw e;
  } finally {
    await releaseLock(redis, lockKey, lockVal);
  }
}
