import { Queue, Worker, type Job } from 'bullmq';
import type IORedis from 'ioredis';
import { randomUUID } from 'node:crypto';
import { LogLevel, NumberState, prisma } from '@monitor/database';
import { EvolutionClient, getEvolutionTimeoutsMs } from '@monitor/shared';
import { acquireLock, releaseLock } from '../lock.js';
import { getRedis } from '../redis.js';
import { logJson } from '../logger.js';
import { decryptProjectSecret } from '../decrypt.js';

export type RestartJobData = { numberId: string };

const LOCK_TTL_SEC = 120;

export function createRestartWorker(connection: IORedis) {
  return new Worker<RestartJobData>(
    'restart',
    async (job: Job<RestartJobData>) => {
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
        const timeouts = getEvolutionTimeoutsMs();
        const apiKey = decryptProjectSecret(number.project.evolutionApiKey);
        const client = new EvolutionClient(number.project.evolutionUrl, apiKey, timeouts);
        await client.restart(number.instanceName);
        await prisma.number.update({
          where: { id: numberId },
          data: { state: NumberState.RESTARTING },
        });
        await prisma.log.create({
          data: {
            numberId,
            projectId: number.projectId,
            level: LogLevel.INFO,
            event: 'restart_triggered',
            meta: {},
          },
        });
        const delayMs = number.project.config.retryDelay * 1000;
        const healthQueue = new Queue('health-check', { connection });
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
    },
    { connection }
  );
}
