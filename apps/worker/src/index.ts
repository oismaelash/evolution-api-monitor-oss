import { Queue, type Job } from 'bullmq';
import { loadEnv } from '@monitor/shared';
import { Redis } from 'ioredis';
import { createAlertWorker } from './jobs/alert.js';
import { createDlqWorker } from './jobs/dlq.js';
import { createHealthCheckWorker } from './jobs/health-check.js';
import { createRestartWorker } from './jobs/restart.js';
import { logJson } from './logger.js';

export async function enqueueDlq(connection: Redis, sourceQueue: string, job: Job | undefined, err: unknown) {
  const e = err instanceof Error ? err : new Error(String(err));
  const q = new Queue('dead-letter', { connection: connection as never });
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

export function startWorkers() {
  loadEnv();

  const redisUrl = process.env.REDIS_URL;
  if (!redisUrl) {
    throw new Error('REDIS_URL is required');
  }

  const connection = new Redis(redisUrl, { maxRetriesPerRequest: null });

  const health = createHealthCheckWorker(connection as any);
  const restart = createRestartWorker(connection as any);
  const alert = createAlertWorker(connection as any);
  const dlq = createDlqWorker(connection as any);

  health.on('failed', async (job, err) => {
    logJson('error', 'worker_health_failed', { jobId: job?.id, message: (err as Error)?.message });
    await enqueueDlq(connection, 'health-check', job, err);
  });
  restart.on('failed', async (job, err) => {
    logJson('error', 'worker_restart_failed', { jobId: job?.id, message: (err as Error)?.message });
    await enqueueDlq(connection, 'restart', job, err);
  });
  alert.on('failed', async (job, err) => {
    logJson('error', 'worker_alert_failed', { jobId: job?.id, message: (err as Error)?.message });
    await enqueueDlq(connection, 'alert', job, err);
  });
  dlq.on('failed', (job, err) => {
    logJson('error', 'worker_dlq_failed', { jobId: job?.id, message: err?.message });
  });

  logJson('info', 'worker_started', { queues: ['health-check', 'restart', 'alert', 'dead-letter'] });

  return { connection, health, restart, alert, dlq };
}

// Only start automatically if this file is the main module
if (import.meta.url === `file://${process.argv[1]}`) {
  startWorkers();
}
