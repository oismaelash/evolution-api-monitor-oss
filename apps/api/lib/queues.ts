import { Queue } from 'bullmq';
import IORedis from 'ioredis';
import { loadEnv } from '@monitor/shared';

let connection: IORedis | null = null;

function getConnection(): IORedis {
  if (!connection) {
    connection = new IORedis(loadEnv().REDIS_URL, { maxRetriesPerRequest: null });
  }
  return connection;
}

export async function upsertHealthSchedule(numberId: string, intervalSeconds: number): Promise<void> {
  const conn = getConnection();
  const queue = new Queue('health-check', { connection: conn });
  const jobId = `number:${numberId}:health-check`;
  const repeatable = await queue.getRepeatableJobs();
  for (const j of repeatable) {
    if (j.id === jobId || (j.name === 'health-check' && j.key.includes(numberId))) {
      await queue.removeRepeatableByKey(j.key);
    }
  }
  const everyMs = Math.max(30_000, intervalSeconds * 1000);
  await queue.add(
    'health-check',
    { numberId },
    {
      jobId,
      repeat: { every: everyMs },
    }
  );
}

export async function removeHealthSchedule(numberId: string): Promise<void> {
  const conn = getConnection();
  const queue = new Queue('health-check', { connection: conn });
  const jobId = `number:${numberId}:health-check`;
  const repeatable = await queue.getRepeatableJobs();
  for (const j of repeatable) {
    if (j.id === jobId || (j.name === 'health-check' && j.key.includes(numberId))) {
      await queue.removeRepeatableByKey(j.key);
    }
  }
}

export async function enqueueManualRestart(numberId: string): Promise<void> {
  const conn = getConnection();
  const queue = new Queue('restart', { connection: conn });
  await queue.add('restart', { numberId }, { jobId: `manual-restart:${numberId}:${Date.now()}` });
}
