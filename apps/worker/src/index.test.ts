import { describe, expect, it, vi, beforeEach } from 'vitest';
import { Queue } from 'bullmq';
import { startWorkers, enqueueDlq } from './index.js';

vi.mock('bullmq', () => {
  const QueueMock = vi.fn().mockImplementation(() => ({
    add: vi.fn().mockResolvedValue({ id: 'dlq-job-1' }),
  }));
  const WorkerMock = vi.fn().mockImplementation(() => ({
    on: vi.fn(),
    close: vi.fn(),
  }));
  return { Queue: QueueMock, Worker: WorkerMock };
});

vi.mock('ioredis', () => {
  return {
    Redis: vi.fn().mockImplementation(() => ({
      quit: vi.fn(),
      disconnect: vi.fn(),
    })),
  };
});

describe('Worker Bootstrap', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.REDIS_URL = 'redis://localhost:6379';
    process.env.ENCRYPTION_KEY = 'a'.repeat(64);
    process.env.DATABASE_URL = 'postgresql://localhost:5432/test';
  });

  it('throws if REDIS_URL is not set', () => {
    delete process.env.REDIS_URL;
    expect(() => startWorkers()).toThrow();
  });

  it('starts workers and binds failed events', () => {
    const { health, restart, alert, dlq } = startWorkers();
    
    expect(health.on).toHaveBeenCalledWith('failed', expect.any(Function));
    expect(restart.on).toHaveBeenCalledWith('failed', expect.any(Function));
    expect(alert.on).toHaveBeenCalledWith('failed', expect.any(Function));
    expect(dlq.on).toHaveBeenCalledWith('failed', expect.any(Function));
  });

  it('enqueueDlq adds job to dead-letter queue', async () => {
    const fakeConnection = {} as any;
    await enqueueDlq(fakeConnection, 'health-check', { id: 'job-1', data: { a: 1 } } as any, new Error('boom'));
    
    expect(Queue).toHaveBeenCalledWith('dead-letter', expect.any(Object));
    const mockQueueInstance = vi.mocked(Queue).mock.results[0]!.value;
    expect(mockQueueInstance.add).toHaveBeenCalledWith(
      'record',
      {
        sourceQueue: 'health-check',
        jobId: 'job-1',
        errorMessage: 'boom',
        data: { a: 1 },
      },
      { removeOnComplete: true }
    );
  });

  it('failed event handlers call enqueueDlq', async () => {
    const { health, restart, alert, dlq } = startWorkers();
    
    const healthFailedHandler = vi.mocked(health.on).mock.calls.find(c => c[0] === 'failed')?.[1];
    const restartFailedHandler = vi.mocked(restart.on).mock.calls.find(c => c[0] === 'failed')?.[1];
    const alertFailedHandler = vi.mocked(alert.on).mock.calls.find(c => c[0] === 'failed')?.[1];
    const dlqFailedHandler = vi.mocked(dlq.on).mock.calls.find(c => c[0] === 'failed')?.[1];

    // Trigger handlers to cover the lines
    if (healthFailedHandler) await (healthFailedHandler as any)({ id: 'h1' }, new Error('health fail'));
    if (restartFailedHandler) await (restartFailedHandler as any)({ id: 'r1' }, new Error('restart fail'));
    if (alertFailedHandler) await (alertFailedHandler as any)({ id: 'a1' }, new Error('alert fail'));
    if (dlqFailedHandler) (dlqFailedHandler as any)({ id: 'd1' }, new Error('dlq fail')); // dlq doesn't enqueue to dlq

    // Verify DLQ queue was instantiated for the 3 handlers that enqueue
    expect(Queue).toHaveBeenCalledTimes(3);
  });
});
