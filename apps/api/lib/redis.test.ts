import { describe, expect, it, vi, beforeEach } from 'vitest';
import { getRedis } from './redis.js';

vi.mock('ioredis', () => {
  return {
    default: vi.fn().mockImplementation(() => ({
      status: 'mocked',
    })),
  };
});

describe('redis', () => {
  beforeEach(() => {
    vi.resetModules();
    process.env.REDIS_URL = 'redis://localhost:6379';
    process.env.ENCRYPTION_KEY = 'a'.repeat(64);
  });

  it('returns a singleton redis instance', () => {
    const r1 = getRedis();
    const r2 = getRedis();
    expect(r1).toBe(r2);
    expect((r1 as any).status).toBe('mocked');
  });
});
