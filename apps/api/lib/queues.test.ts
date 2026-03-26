import { describe, expect, it, vi, beforeEach } from 'vitest';
import { Queue } from 'bullmq';
import {
  upsertHealthSchedule,
  removeHealthSchedule,
  enqueueImmediateHealthCheck,
  enqueueManualRestart,
} from './queues.js';

vi.mock('bullmq', () => {
  const getRepeatableJobs = vi.fn().mockResolvedValue([]);
  const removeRepeatableByKey = vi.fn().mockResolvedValue(true);
  const add = vi.fn().mockResolvedValue({ id: 'job-id' });
  
  return {
    Queue: vi.fn().mockImplementation(() => ({
      getRepeatableJobs,
      removeRepeatableByKey,
      add,
    })),
  };
});

vi.mock('ioredis', () => {
  return {
    default: vi.fn().mockImplementation(() => ({})),
  };
});

describe('queues', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.REDIS_URL = 'redis://localhost';
    process.env.ENCRYPTION_KEY = 'a'.repeat(64);
  });

  it('upsertHealthSchedule removes existing and adds new job', async () => {
    // call once to instantiate the mock
    await upsertHealthSchedule('n1', 60);
    const queueMock = vi.mocked(Queue).mock.results[0]?.value;

    queueMock.getRepeatableJobs.mockResolvedValueOnce([
      { id: 'number:n1:health-check', name: 'health-check', key: 'key1' },
      { id: 'other', name: 'health-check', key: 'key2-n1' },
      { id: 'other', name: 'health-check', key: 'key3' },
    ]);

    await upsertHealthSchedule('n1', 60);

    expect(queueMock.removeRepeatableByKey).toHaveBeenCalledWith('key1');
    expect(queueMock.removeRepeatableByKey).toHaveBeenCalledWith('key2-n1');
    expect(queueMock.removeRepeatableByKey).not.toHaveBeenCalledWith('key3');
    
    expect(queueMock.add).toHaveBeenCalledWith(
      'health-check',
      { numberId: 'n1' },
      { jobId: 'number:n1:health-check', repeat: { every: 60000 } }
    );
  });

  it('removeHealthSchedule removes matching jobs', async () => {
    // call once to instantiate the mock
    await removeHealthSchedule('n3');
    const queueMock = vi.mocked(Queue).mock.results.slice(-1)[0]?.value;

    queueMock.getRepeatableJobs.mockResolvedValueOnce([
      { id: 'number:n3:health-check', name: 'health-check', key: 'key1-n3' },
      { id: 'other', name: 'health-check', key: 'key2-n3' },
      { id: 'other', name: 'health-check', key: 'key3' },
    ]);

    await removeHealthSchedule('n3');
    
    expect(queueMock.removeRepeatableByKey).toHaveBeenCalledWith('key1-n3');
    expect(queueMock.removeRepeatableByKey).toHaveBeenCalledWith('key2-n3');
    expect(queueMock.removeRepeatableByKey).not.toHaveBeenCalledWith('key3');
  });

  it('upsertHealthSchedule enforces minimum interval of 30s', async () => {
    await upsertHealthSchedule('n2', 10);
    const q = vi.mocked(Queue).mock.results.slice(-1)[0].value;
    expect(q.add).toHaveBeenCalledWith(
      'health-check',
      { numberId: 'n2' },
      expect.objectContaining({ repeat: { every: 30000 } })
    );
  });

  it('enqueueImmediateHealthCheck adds job', async () => {
    await enqueueImmediateHealthCheck('n4');
    const q = vi.mocked(Queue).mock.results.slice(-1)[0].value;
    expect(q.add).toHaveBeenCalledWith('health-check', { numberId: 'n4' }, expect.any(Object));
  });

  it('enqueueManualRestart adds job', async () => {
    await enqueueManualRestart('n5');
    const q = vi.mocked(Queue).mock.results.slice(-1)[0].value;
    expect(q.add).toHaveBeenCalledWith('restart', { numberId: 'n5' }, expect.any(Object));
  });
});
