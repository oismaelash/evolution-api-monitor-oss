import { Worker, type Job } from 'bullmq';
import { randomUUID } from 'node:crypto';
import nodemailer from 'nodemailer';
import { prisma } from '@monitor/database';
import {
  AlertChannel,
  ErrorType,
  EvolutionClient,
  LogLevel,
  getEvolutionTimeoutsMs,
  loadEnv,
} from '@monitor/shared';
import { acquireLock, releaseLock } from '../lock.js';
import type { RedisClient } from '../redis.js';
import { getRedis } from '../redis.js';
import { logJson } from '../logger.js';
import { decryptProjectSecret } from '../decrypt.js';

export type AlertFailureJobData = {
  numberId: string;
  errorType: ErrorType;
};

export type AlertResolvedJobData = {
  numberId: string;
};

const LOCK_TTL_SEC = 60;

type BasePayload = {
  instanceName: string;
  projectName: string;
  errorType?: ErrorType;
  qrCodeBase64?: string;
  pairingCode?: string;
  resolved?: boolean;
};

function applySimpleTemplate(tpl: string, vars: Record<string, string>): string {
  return tpl.replace(/\{\{\s*(\w+)\s*\}\}/g, (_, key) => vars[key] ?? '');
}

function renderMessage(
  advanced: boolean,
  template: string | null | undefined,
  vars: Record<string, unknown>,
  fallback: string
): string {
  if (advanced && template && template.trim().length > 0) {
    const strVars: Record<string, string> = {};
    for (const [k, v] of Object.entries(vars)) {
      strVars[k] = v == null ? '' : String(v);
    }
    try {
      return applySimpleTemplate(template, strVars);
    } catch (e) {
      logJson('warn', 'alert_template_failed', { message: (e as Error).message });
    }
  }
  return fallback;
}

function decryptSmtpPass(cipher: string | null | undefined): string | undefined {
  if (!cipher) return undefined;
  return decryptProjectSecret(cipher);
}

export function createAlertWorker(connection: RedisClient) {
  return new Worker(
    'alert',
    async (job: Job<AlertFailureJobData | AlertResolvedJobData>) => {
      const isResolved = job.name === 'alert-resolved';
      const numberId = job.data.numberId;
      const redis = getRedis();
      const lockVal = randomUUID();
      const lockKey = `number:${numberId}:lock`;
      const got = await acquireLock(redis, lockKey, LOCK_TTL_SEC, lockVal);
      if (!got) {
        logJson('warn', 'alert_lock_busy', { numberId, isResolved });
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

        if (!isResolved) {
          const cooldownKey = `alert:cooldown:${numberId}`;
          const setOk = await redis.set(cooldownKey, '1', 'EX', cfg.alertCooldown, 'NX');
          if (setOk !== 'OK') {
            logJson('info', 'alert_skipped_cooldown', { numberId });
            return;
          }
        }

        const env = loadEnv();
        const timeouts = getEvolutionTimeoutsMs();
        const apiKey = decryptProjectSecret(number.project.evolutionApiKey);
        const evo = new EvolutionClient(number.project.evolutionUrl, apiKey, timeouts);

        let qrBase64: string | undefined;
        let pairingCode: string | undefined;
        if (!isResolved) {
          try {
            const conn = await evo.getConnect(number.instanceName);
            qrBase64 = conn.qrBase64;
            pairingCode = conn.pairingCode;
          } catch {
            // optional QR
          }
        }

        const errorType = isResolved ? undefined : (job.data as AlertFailureJobData).errorType;

        const payload: BasePayload = {
          instanceName: number.instanceName,
          projectName: number.project.name,
          errorType,
          qrCodeBase64: qrBase64,
          pairingCode,
          resolved: isResolved,
        };

        const advanced = env.CLOUD_ADVANCED_ALERTS === true;
        const vars = {
          instanceName: number.instanceName,
          projectName: number.project.name,
          errorType: errorType ?? '',
          qrCodeBase64: qrBase64 ?? '',
          pairingCode: pairingCode ?? '',
          timestamp: new Date().toISOString(),
          resolved: isResolved,
        };

        const defaultFailureText = `${number.project.name}: ${number.instanceName} — ${errorType}. Reconnect if needed.`;
        const defaultResolvedText = `${number.project.name}: ${number.instanceName} is healthy again.`;
        const monitorMessage = isResolved
          ? defaultResolvedText
          : renderMessage(advanced, cfg.alertTemplate, vars, defaultFailureText);

        const isLive = env.MONITOR_STATUS_API_KEY?.startsWith('ps_live_');
        const channels = cfg.alertChannels;
        const channelsSent: string[] = [];

        for (const ch of channels) {
          if (ch === AlertChannel.MONITOR_STATUS && env.MONITOR_STATUS_API_KEY) {
            const { PilotStatusClient } = await import('@pilot-status/sdk');
            const client = new PilotStatusClient({
              apiKey: env.MONITOR_STATUS_API_KEY,
            });

            const dest = number.project.alertPhone ?? '';
            if (!dest) {
              logJson('warn', 'alert_monitor_missing_phone', { numberId });
              continue;
            }

            const e164Dest = dest.startsWith('+') ? dest : `+${dest.replace(/^\+/, '')}`;

            // Check Opt-in if LIVE
            if (isLive) {
              try {
                const optIn = await client.messages.checkOptIn(e164Dest);
                if (!optIn.authorized) {
                  logJson('warn', 'alert_monitor_missing_optin', { numberId, reason: optIn.reason });
                  continue;
                }
              } catch (e) {
                logJson('error', 'alert_monitor_optin_error', { numberId, message: (e as Error).message });
                // We proceed if we can't check, or we could stop. Let's proceed but log.
              }
            }

            const row = await prisma.alert.create({
              data: {
                numberId,
                channel: AlertChannel.MONITOR_STATUS as never,
                payload: { ...payload, message: monitorMessage } as object,
              },
            });

            try {
              const accepted = await client.messages.send({
                templateId: cfg.alertTemplate || 'default',
                destinationNumber: e164Dest,
                variables: {
                  message: monitorMessage, // Fallback for old templates
                  instanceName: number.instanceName,
                  projectName: number.project.name,
                  errorType: errorType || 'None',
                  status: isResolved ? 'Healthy' : 'Error',
                },
              });

              await prisma.alert.update({
                where: { id: row.id },
                data: { delivered: true, payload: { ...payload, pilotStatusId: accepted.id } as object },
              });
              channelsSent.push('MONITOR_STATUS');
            } catch (e) {
              const err = e as Error;
              await prisma.alert.update({
                where: { id: row.id },
                data: { deliveryError: err.message },
              });
              logJson('error', 'alert_monitor_failed', { numberId, message: err.message });
            }
          }

          if (ch === AlertChannel.EMAIL && cfg.smtpHost && cfg.smtpPort && cfg.alertEmail) {
            const pass = decryptSmtpPass(cfg.smtpPass);
            const transporter = nodemailer.createTransport({
              host: cfg.smtpHost,
              port: cfg.smtpPort,
              secure: cfg.smtpPort === 465,
              auth:
                cfg.smtpUser && pass
                  ? {
                    user: cfg.smtpUser,
                    pass,
                  }
                  : undefined,
            });
            const subject = isResolved
              ? `[OK] ${number.instanceName} reconnected`
              : `[ALERT] ${number.instanceName} — ${errorType}`;
            const textBody = isResolved
              ? defaultResolvedText
              : renderMessage(advanced, cfg.alertTemplate, vars, defaultFailureText);
            const htmlBody = textBody.replace(/\n/g, '<br/>');
            const row = await prisma.alert.create({
              data: {
                numberId,
                channel: AlertChannel.EMAIL as never,
                payload: { ...payload, subject, textBody } as object,
              },
            });
            try {
              await transporter.sendMail({
                from: cfg.smtpFrom ?? cfg.smtpUser ?? 'monitor@localhost',
                to: cfg.alertEmail,
                subject,
                text: textBody,
                html: htmlBody,
              });
              await prisma.alert.update({
                where: { id: row.id },
                data: { delivered: true },
              });
              channelsSent.push('EMAIL');
            } catch (e) {
              const err = e as Error;
              await prisma.alert.update({
                where: { id: row.id },
                data: { deliveryError: err.message },
              });
              logJson('error', 'alert_email_failed', { numberId, message: err.message });
            }
          }

          if (ch === AlertChannel.WEBHOOK && cfg.webhookUrl) {
            const row = await prisma.alert.create({
              data: {
                numberId,
                channel: AlertChannel.WEBHOOK as never,
                payload: payload as object,
              },
            });
            try {
              const headers: Record<string, string> = { 'Content-Type': 'application/json' };
              if (cfg.webhookSecret) {
                headers['X-Webhook-Secret'] = cfg.webhookSecret;
              }
              const res = await fetch(cfg.webhookUrl, {
                method: 'POST',
                headers,
                body: JSON.stringify(payload),
              });
              if (!res.ok) {
                throw new Error(`webhook ${res.status}`);
              }
              await prisma.alert.update({
                where: { id: row.id },
                data: { delivered: true },
              });
              channelsSent.push('WEBHOOK');
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

        if (!isResolved) {
          await prisma.number.update({
            where: { id: numberId },
            data: { lastAlertSentAt: new Date() },
          });
          await prisma.log.create({
            data: {
              numberId,
              projectId: number.projectId,
              level: LogLevel.WARN as never,
              event: 'alert_sent',
              errorType: errorType as never,
              meta: { channels: channelsSent },
            },
          });
        } else {
          logJson('info', 'alert_resolved', { numberId, channels: channelsSent });
          await prisma.log.create({
            data: {
              numberId,
              projectId: number.projectId,
              level: LogLevel.INFO as never,
              event: 'alert_resolved',
              meta: { channels: channelsSent },
            },
          });
        }
      } catch (e) {
        const err = e as Error;
        logJson('error', 'alert_job_failed', { numberId, message: err.message });
        throw e;
      } finally {
        await releaseLock(redis, lockKey, lockVal);
      }
    },
    { connection: connection as never }
  );
}
