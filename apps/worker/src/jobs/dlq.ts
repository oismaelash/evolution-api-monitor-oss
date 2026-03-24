import { Worker, type Job } from 'bullmq';
import { prisma } from '@monitor/database';
import { LogLevel } from '@monitor/shared';
import { logJson } from '../logger.js';
import type { RedisClient } from '../redis.js';

export type DlqJobData = {
  sourceQueue: string;
  jobId?: string;
  errorMessage?: string;
  data?: unknown;
};

export function createDlqWorker(connection: RedisClient) {
  return new Worker<DlqJobData>(
    'dead-letter',
    async (job: Job<DlqJobData>) => {
      const { sourceQueue, jobId, errorMessage, data } = job.data;
      await prisma.log.create({
        data: {
          level: LogLevel.ERROR as never,
          event: 'job_dead_letter',
          meta: { sourceQueue, jobId, errorMessage, data } as object,
        },
      });
      logJson('error', 'job_dead_letter', { sourceQueue, jobId, errorMessage });
    },
    { connection: connection as never }
  );
}
