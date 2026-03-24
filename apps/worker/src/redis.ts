import { Redis } from 'ioredis';
import { loadEnv } from '@monitor/shared';

export type RedisClient = InstanceType<typeof Redis>;

let redis: RedisClient | null = null;

export function getRedis(): RedisClient {
  if (redis) return redis;
  const env = loadEnv();
  redis = new Redis(env.REDIS_URL, { maxRetriesPerRequest: null });
  return redis;
}
