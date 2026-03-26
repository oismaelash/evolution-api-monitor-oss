import { describe, it, expect, beforeEach } from 'vitest';
import { Queue, QueueEvents } from 'bullmq';
import { Redis } from 'ioredis';
import { prisma } from '@monitor/database';
import { createDlqWorker } from './dlq.js';

describe('Worker: DLQ', () => {
  beforeEach(async () => {
    await prisma.log.deleteMany({ where: { event: 'job_dead_letter' } });
  });

  it('records dead-letter jobs into the database', async () => {
    const redisUrl = process.env.REDIS_URL;
    expect(redisUrl).toBeTruthy();

    const connection = new Redis(redisUrl!, { maxRetriesPerRequest: null });
    const worker = createDlqWorker(connection as any);
    const queue = new Queue('dead-letter', { connection: connection as any });
    const events = new QueueEvents('dead-letter', { connection: connection as any });

    await events.waitUntilReady();
    const job = await queue.add(
      'record',
      { sourceQueue: 'alert', jobId: 'job-1', errorMessage: 'boom', data: { hello: 'world' } },
      { removeOnComplete: true }
    );

    await (job as any).waitUntilFinished(events);

    const row = await prisma.log.findFirst({
      where: { event: 'job_dead_letter' },
      orderBy: { createdAt: 'desc' },
    });

    expect(row).toBeTruthy();
    expect((row!.meta as any).sourceQueue).toBe('alert');
    expect((row!.meta as any).errorMessage).toBe('boom');

    await worker.close();
    await events.close();
    await queue.close();
    await connection.quit();
  });
});

