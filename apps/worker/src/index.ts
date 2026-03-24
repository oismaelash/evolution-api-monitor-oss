import { Queue, type Job } from 'bullmq';
import { loadEnv } from '@monitor/shared';
import IORedis from 'ioredis';
import { createAlertWorker } from './jobs/alert.js';
import { createDlqWorker } from './jobs/dlq.js';
import { createHealthCheckWorker } from './jobs/health-check.js';
import { createRestartWorker } from './jobs/restart.js';
import { logJson } from './logger.js';

loadEnv();

const redisUrl = process.env.REDIS_URL;
if (!redisUrl) {
  throw new Error('REDIS_URL is required');
}

const connection = new IORedis(redisUrl, { maxRetriesPerRequest: null });

const health = createHealthCheckWorker(connection);
const restart = createRestartWorker(connection);
const alert = createAlertWorker(connection);
const dlq = createDlqWorker(connection);

async function enqueueDlq(sourceQueue: string, job: Job | undefined, err: unknown) {
  const e = err instanceof Error ? err : new Error(String(err));
  const q = new Queue('dead-letter', { connection });
  await q.add(
    'record',
    {
      sourceQueue,
      jobId: job?.id,
      errorMessage: e.message,
      data: job?.data,
    },
    { removeOnComplete: true }
  );
}

health.on('failed', async (job, err) => {
  logJson('error', 'worker_health_failed', { jobId: job?.id, message: (err as Error)?.message });
  await enqueueDlq('health-check', job, err);
});
restart.on('failed', async (job, err) => {
  logJson('error', 'worker_restart_failed', { jobId: job?.id, message: (err as Error)?.message });
  await enqueueDlq('restart', job, err);
});
alert.on('failed', async (job, err) => {
  logJson('error', 'worker_alert_failed', { jobId: job?.id, message: (err as Error)?.message });
  await enqueueDlq('alert', job, err);
});
dlq.on('failed', (job, err) => {
  logJson('error', 'worker_dlq_failed', { jobId: job?.id, message: err?.message });
});

logJson('info', 'worker_started', { queues: ['health-check', 'restart', 'alert', 'dead-letter'] });
