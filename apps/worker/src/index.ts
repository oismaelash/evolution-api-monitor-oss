import { loadEnv } from '@pilot/shared';
import IORedis from 'ioredis';
import { createHealthCheckWorker } from './jobs/health-check.js';
import { createRestartWorker } from './jobs/restart.js';
import { createAlertWorker } from './jobs/alert.js';
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

health.on('failed', (job, err) => {
  logJson('error', 'worker_health_failed', { jobId: job?.id, message: err?.message });
});
restart.on('failed', (job, err) => {
  logJson('error', 'worker_restart_failed', { jobId: job?.id, message: err?.message });
});
alert.on('failed', (job, err) => {
  logJson('error', 'worker_alert_failed', { jobId: job?.id, message: err?.message });
});

logJson('info', 'worker_started', { queues: ['health-check', 'restart', 'alert'] });
