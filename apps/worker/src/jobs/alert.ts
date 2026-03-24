import { Worker, type Job } from 'bullmq';
import type IORedis from 'ioredis';
import { randomUUID } from 'node:crypto';
import { AlertChannel, ErrorType, LogLevel, prisma } from '@pilot/database';
import { EvolutionClient, loadEnv } from '@pilot/shared';
import { acquireLock, releaseLock } from '../lock.js';
import { getRedis } from '../redis.js';
import { logJson } from '../logger.js';
import { decryptProjectSecret } from '../decrypt.js';

export type AlertJobData = {
  numberId: string;
  errorType: ErrorType;
};

const LOCK_TTL_SEC = 60;

export function createAlertWorker(connection: IORedis) {
  return new Worker<AlertJobData>(
    'alert',
    async (job: Job<AlertJobData>) => {
      const { numberId, errorType } = job.data;
      const redis = getRedis();
      const lockVal = randomUUID();
      const lockKey = `number:${numberId}:lock`;
      const got = await acquireLock(redis, lockKey, LOCK_TTL_SEC, lockVal);
      if (!got) {
        logJson('warn', 'alert_lock_busy', { numberId });
        return;
      }
      try {
        const number = await prisma.number.findUnique({
          where: { id: numberId },
          include: { project: { include: { config: true } } },
        });
        if (!number?.project.config) {
          return;
        }
        const cfg = number.project.config;
        const cooldownKey = `alert:cooldown:${numberId}`;
        const setOk = await redis.set(cooldownKey, '1', 'EX', cfg.alertCooldown, 'NX');
        if (setOk !== 'OK') {
          logJson('info', 'alert_skipped_cooldown', { numberId });
          return;
        }

        const apiKey = decryptProjectSecret(number.project.evolutionApiKey);
        const evo = new EvolutionClient(number.project.evolutionUrl, apiKey);
        let qrBase64: string | undefined;
        let pairingCode: string | undefined;
        try {
          const conn = await evo.getConnect(number.instanceName);
          qrBase64 = conn.qrBase64;
          pairingCode = conn.pairingCode;
        } catch {
          // optional QR
        }

        const payload = {
          instanceName: number.instanceName,
          projectName: number.project.name,
          errorType,
          qrCodeBase64: qrBase64,
          pairingCode,
        };

        const env = loadEnv();
        const channels = cfg.alertChannels;

        for (const ch of channels) {
          if (ch === AlertChannel.PILOT_STATUS && env.PILOT_STATUS_API_KEY && env.PILOT_STATUS_BASE_URL) {
            const dest = number.project.alertPhone ?? '';
            if (!dest) {
              logJson('warn', 'alert_pilot_missing_phone', { numberId });
              continue;
            }
            const row = await prisma.alert.create({
              data: {
                numberId,
                channel: AlertChannel.PILOT_STATUS,
                payload: payload as object,
              },
            });
            try {
              const base = env.PILOT_STATUS_BASE_URL.replace(/\/$/, '');
              const res = await fetch(`${base}/v1/messages/send`, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'x-api-key': env.PILOT_STATUS_API_KEY,
                },
                body: JSON.stringify({
                  templateId: 'default',
                  destinationNumber: dest.startsWith('+') ? dest : `+${dest.replace(/^\+/, '')}`,
                  variables: {
                    message: `${number.project.name}: ${number.instanceName} — ${errorType}. Reconnect if needed.`,
                  },
                }),
              });
              if (!res.ok && res.status !== 202) {
                const t = await res.text();
                throw new Error(`pilot status ${res.status}: ${t}`);
              }
              await prisma.alert.update({
                where: { id: row.id },
                data: { delivered: true },
              });
            } catch (e) {
              const err = e as Error;
              await prisma.alert.update({
                where: { id: row.id },
                data: { deliveryError: err.message },
              });
              logJson('error', 'alert_pilot_failed', { numberId, message: err.message });
            }
          }

          if (ch === AlertChannel.WEBHOOK && cfg.webhookUrl) {
            const row = await prisma.alert.create({
              data: {
                numberId,
                channel: AlertChannel.WEBHOOK,
                payload: payload as object,
              },
            });
            try {
              const res = await fetch(cfg.webhookUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
              });
              if (!res.ok) {
                throw new Error(`webhook ${res.status}`);
              }
              await prisma.alert.update({
                where: { id: row.id },
                data: { delivered: true },
              });
            } catch (e) {
              const err = e as Error;
              await prisma.alert.update({
                where: { id: row.id },
                data: { deliveryError: err.message },
              });
              logJson('error', 'alert_webhook_failed', { numberId, message: err.message });
            }
          }
        }

        await prisma.number.update({
          where: { id: numberId },
          data: { lastAlertSentAt: new Date() },
        });
        await prisma.log.create({
          data: {
            numberId,
            projectId: number.projectId,
            level: LogLevel.WARN,
            event: 'alert_sent',
            errorType,
            meta: { channels },
          },
        });
      } catch (e) {
        const err = e as Error;
        logJson('error', 'alert_job_failed', { numberId, message: err.message });
        throw e;
      } finally {
        await releaseLock(redis, lockKey, lockVal);
      }
    },
    { connection }
  );
}
