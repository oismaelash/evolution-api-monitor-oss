import IORedis from 'ioredis';
import { loadEnv } from '@monitor/shared';

let redis: IORedis | null = null;

export function getRedis(): IORedis {
  if (!redis) {
    redis = new IORedis(loadEnv().REDIS_URL, { maxRetriesPerRequest: null });
  }
  return redis;
}
