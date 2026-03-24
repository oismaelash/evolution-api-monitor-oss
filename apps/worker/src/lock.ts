import type IORedis from 'ioredis';

export async function acquireLock(
  redis: IORedis,
  key: string,
  ttlSec: number,
  value: string
): Promise<string | null> {
  const result = await redis.set(key, value, 'EX', ttlSec, 'NX');
  return result === 'OK' ? value : null;
}

export async function releaseLock(redis: IORedis, key: string, value: string): Promise<void> {
  const script = `
    if redis.call("get", KEYS[1]) == ARGV[1] then
      return redis.call("del", KEYS[1])
    else
      return 0
    end
  `;
  await redis.eval(script, 1, key, value);
}
