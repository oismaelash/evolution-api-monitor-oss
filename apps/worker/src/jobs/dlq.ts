import { Worker, type Job } from 'bullmq';
import type IORedis from 'ioredis';
import { LogLevel, prisma } from '@monitor/database';
import { logJson } from '../logger.js';

export type DlqJobData = {
  sourceQueue: string;
  jobId?: string;
  errorMessage?: string;
  data?: unknown;
};

export function createDlqWorker(connection: IORedis) {
  return new Worker<DlqJobData>(
    'dead-letter',
    async (job: Job<DlqJobData>) => {
      const { sourceQueue, jobId, errorMessage, data } = job.data;
      await prisma.log.create({
        data: {
          level: LogLevel.ERROR,
          event: 'job_dead_letter',
          meta: { sourceQueue, jobId, errorMessage, data } as object,
        },
      });
      logJson('error', 'job_dead_letter', { sourceQueue, jobId, errorMessage });
    },
    { connection }
  );
}
