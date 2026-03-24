import IORedis from 'ioredis';
import { loadEnv } from '@monitor/shared';

let redis: IORedis | null = null;

export function getRedis(): IORedis {
  if (redis) return redis;
  const env = loadEnv();
  redis = new IORedis(env.REDIS_URL, { maxRetriesPerRequest: null });
  return redis;
}
