import { Queue, Worker, type Job } from 'bullmq';
import type IORedis from 'ioredis';
import { randomUUID } from 'node:crypto';
import {
  ErrorType,
  HealthStatus,
  LogLevel,
  NumberState,
  prisma,
} from '@monitor/database';
import { EvolutionClient, computeDelayMs, loadEnv, RetryStrategy as RetryStrategyConst } from '@monitor/shared';
import { acquireLock, releaseLock } from '../lock.js';
import { getRedis } from '../redis.js';
import { logJson } from '../logger.js';
import { decryptProjectSecret } from '../decrypt.js';

export type HealthCheckJobData = { numberId: string };

const PING_TIMEOUT = 5000;
const RESTART_TIMEOUT = 10_000;
const LOCK_TTL_SEC = 60;

function prismaErrorFromString(code: string): ErrorType {
  if (code === 'NETWORK_ERROR') return ErrorType.NETWORK_ERROR;
  if (code === 'AUTH_ERROR') return ErrorType.AUTH_ERROR;
  if (code === 'INSTANCE_NOT_FOUND') return ErrorType.INSTANCE_NOT_FOUND;
  if (code === 'RATE_LIMIT') return ErrorType.RATE_LIMIT;
  return ErrorType.UNKNOWN;
}

export function createHealthCheckWorker(connection: IORedis) {
  return new Worker<HealthCheckJobData>(
    'health-check',
    async (job: Job<HealthCheckJobData>) => {
      const { numberId } = job.data;
      const redis = getRedis();
      const lockVal = randomUUID();
      const lockKey = `number:${numberId}:lock`;
      const got = await acquireLock(redis, lockKey, LOCK_TTL_SEC, lockVal);
      if (!got) {
        logJson('warn', 'health_check_lock_busy', { numberId });
        return;
      }
      try {
        const number = await prisma.number.findUnique({
          where: { id: numberId },
          include: { project: { include: { config: true } } },
        });
        if (!number?.monitored) {
          logJson('debug', 'health_check_skipped_not_monitored', { numberId });
          return;
        }
        const config = number.project.config;
        if (!config) {
          logJson('error', 'health_check_missing_config', {
            numberId,
            projectId: number.projectId,
          });
          return;
        }

        const env = loadEnv();
        const apiKey = decryptProjectSecret(number.project.evolutionApiKey);
        const client = new EvolutionClient(number.project.evolutionUrl, apiKey, {
          pingTimeoutMs: PING_TIMEOUT,
          restartTimeoutMs: RESTART_TIMEOUT,
        });

        const result = await client.checkHealth(number.instanceName);
        const checkedAt = new Date();

        if (result.ok) {
          await prisma.$transaction([
            prisma.healthCheck.create({
              data: {
                numberId,
                status: HealthStatus.HEALTHY,
                responseTimeMs: result.responseTimeMs,
                rawResponse: result.raw as object,
                checkedAt,
              },
            }),
            prisma.number.update({
              where: { id: numberId },
              data: {
                state: NumberState.CONNECTED,
                failureCount: 0,
                lastHealthyAt: checkedAt,
                lastCheckedAt: checkedAt,
              },
            }),
            prisma.log.create({
              data: {
                numberId,
                projectId: number.projectId,
                level: LogLevel.INFO,
                event: 'health_check_ok',
                meta: { responseTimeMs: result.responseTimeMs },
              },
            }),
          ]);
          return;
        }

        const prismaEt = prismaErrorFromString(result.errorType);
        await prisma.healthCheck.create({
          data: {
            numberId,
            status: HealthStatus.UNHEALTHY,
            errorType: prismaEt,
            errorMessage: result.message,
            rawResponse: result.raw as object,
            checkedAt,
          },
        });

        const newCount = number.failureCount + 1;
        await prisma.number.update({
          where: { id: numberId },
          data: {
            failureCount: newCount,
            state: NumberState.DISCONNECTED,
            lastCheckedAt: checkedAt,
          },
        });

        await prisma.log.create({
          data: {
            numberId,
            projectId: number.projectId,
            level: LogLevel.WARN,
            event: 'health_check_failed',
            errorType: prismaEt,
            meta: { failureCount: newCount },
          },
        });

        if (prismaEt === ErrorType.AUTH_ERROR || prismaEt === ErrorType.INSTANCE_NOT_FOUND) {
          await prisma.number.update({
            where: { id: numberId },
            data: { state: NumberState.ERROR },
          });
          const alertQueue = new Queue('alert', { connection });
          await alertQueue.add('alert', { numberId, errorType: prismaEt }, { attempts: 3 });
          return;
        }

        if (newCount >= config.maxRetries) {
          await prisma.number.update({
            where: { id: numberId },
            data: { state: NumberState.ERROR },
          });
          const alertQueue = new Queue('alert', { connection });
          await alertQueue.add('alert', { numberId, errorType: prismaEt }, { attempts: 3 });
          return;
        }

        const useJitter = env.CLOUD_EXPONENTIAL_RETRY;
        const strategy = useJitter
          ? RetryStrategyConst.EXPONENTIAL_JITTER
          : (config.retryStrategy as (typeof RetryStrategyConst)[keyof typeof RetryStrategyConst]);
        const delayMs = computeDelayMs({
          retryStrategy: strategy,
          retryDelayMs: config.retryDelay * 1000,
          attempt: newCount,
        });

        const restartQueue = new Queue('restart', { connection });
        await restartQueue.add(
          'restart',
          { numberId },
          { delay: delayMs, jobId: `restart:${numberId}:${Date.now()}` }
        );
        logJson('info', 'restart_enqueued', { numberId, delayMs, failureCount: newCount });
      } catch (e) {
        const err = e as Error;
        logJson('error', 'health_check_job_failed', {
          numberId,
          message: err.message,
          stack: err.stack,
        });
        throw e;
      } finally {
        await releaseLock(redis, lockKey, lockVal);
      }
    },
    { connection }
  );
}
