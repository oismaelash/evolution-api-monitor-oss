import { describe, it, expect, beforeEach, beforeAll, vi } from 'vitest';
import { prisma } from '@monitor/database';
import { EvolutionClient, resetEnvCacheForTests } from '@monitor/shared';
import nodemailer from 'nodemailer';
import { Redis } from 'ioredis';
import { encryptProjectSecret } from '../decrypt.js';
import * as decryptModule from '../decrypt.js';
import { createAlertWorker, processAlertJob } from './alert.js';

const pilotCheckOptIn = vi.fn();
const pilotSend = vi.fn();
const PilotStatusHttpError = class PilotStatusHttpError extends Error {
  status: number;
  body: unknown;
  constructor(status: number, body: unknown) {
    super('PilotStatusHttpError');
    this.status = status;
    this.body = body;
  }
};

vi.mock('@pilot-status/sdk', () => {
  return {
    PilotStatusClient: vi.fn().mockImplementation(() => {
      return { messages: { checkOptIn: pilotCheckOptIn, send: pilotSend } };
    }),
    PilotStatusHttpError,
  };
});

vi.mock('nodemailer', () => ({
  default: {
    createTransport: vi.fn().mockReturnValue({
      sendMail: vi.fn().mockResolvedValue(true),
    }),
  },
}));

vi.mock('@monitor/shared', async (importOriginal) => {
  const actual = await importOriginal<any>();
  return {
    ...actual,
    EvolutionClient: vi.fn().mockImplementation(() => {
      return {
        getConnect: vi.fn().mockResolvedValue({ qrBase64: undefined, pairingCode: undefined }),
        sendText: vi.fn().mockResolvedValue(true),
      };
    }),
  };
});

describe('Worker: Alert Job', () => {
  let projectId: string;
  let numberId: string;

  beforeAll(async () => {
    process.env.ENCRYPTION_KEY = 'a'.repeat(64);
    resetEnvCacheForTests();
    const user = await prisma.user.create({
      data: { email: 'alert_test@example.com', name: 'Alert Test' },
    });
    const project = await prisma.project.create({
      data: {
        userId: user.id,
        name: 'Alert Project',
        evolutionUrl: 'http://test-evo.com',
        evolutionApiKey: encryptProjectSecret('secret'),
        evolutionFlavor: 'EVOLUTION_V2',
        alertPhone: '+5511999999999',
        config: {
          create: {
            alertCooldown: 10,
            alertChannels: ['EMAIL'],
            alertEmail: 'test@example.com',
            smtpHost: 'smtp.example.com',
            smtpPort: 587,
          } as any,
        },
      },
    });
    projectId = project.id;
  });

  beforeEach(async () => {
    resetEnvCacheForTests();
    pilotCheckOptIn.mockReset();
    pilotSend.mockReset();
    delete process.env.MONITOR_STATUS_API_KEY;
    delete process.env.MONITOR_STATUS_TEMPLATE_ID;
    delete process.env.MONITOR_STATUS_API_KEY;
    delete process.env.NEXTAUTH_URL;
    delete process.env.CLOUD_ADVANCED_ALERTS;

    await prisma.alert.deleteMany();
    await prisma.log.deleteMany();
    await prisma.number.deleteMany();

    await prisma.projectConfig.update({
      where: { projectId },
      data: {
        alertCooldown: 10,
        alertChannels: ['EMAIL'] as any,
        alertEmail: 'test@example.com',
        smtpHost: 'smtp.example.com',
        smtpPort: 587,
        smtpUser: null,
        smtpPass: null,
        webhookUrl: null,
        webhookSecret: null,
      } as any,
    });
    await prisma.project.update({
      where: { id: projectId },
      data: { alertPhone: '+5511999999999' },
    });

    const num = await prisma.number.create({
      data: { projectId, instanceName: 'test-alert-instance', state: 'ERROR', monitored: true } as any,
    });
    numberId = num.id;
  });

  it('sends EMAIL alerts', async () => {
    const job = { name: 'alert', data: { numberId, errorType: 'NETWORK_ERROR' }, id: 'job-1' } as any;
    await processAlertJob(job);
    const row = await prisma.alert.findFirst({ where: { numberId } });
    expect(row?.channel).toBe('EMAIL');
    expect(row?.delivered).toBe(true);
  });

  it('skips duplicate alert jobs during cooldown', async () => {
    await prisma.projectConfig.update({
      where: { projectId },
      data: { alertCooldown: 3600 } as any,
    });
    const job = { name: 'alert', data: { numberId, errorType: 'NETWORK_ERROR' }, id: 'job-cd' } as any;
    await processAlertJob(job);
    await processAlertJob(job);
    const count = await prisma.alert.count({ where: { numberId } });
    expect(count).toBe(1);
  });

  it('skips when lock is busy', async () => {
    const redis = new Redis(process.env.REDIS_URL!, { maxRetriesPerRequest: null });
    await redis.set(`number:${numberId}:lock`, 'held', 'EX', 60);
    await redis.quit();

    const job = { name: 'alert', data: { numberId, errorType: 'NETWORK_ERROR' }, id: 'job-lock' } as any;
    await processAlertJob(job);
    const count = await prisma.alert.count({ where: { numberId } });
    expect(count).toBe(0);
  });

  it('sends WEBHOOK with secret header and records delivery errors', async () => {
    (globalThis as any).fetch = vi.fn().mockResolvedValue({ ok: false, status: 500 });
    await prisma.projectConfig.update({
      where: { projectId },
      data: { alertChannels: ['WEBHOOK'] as any, webhookUrl: 'http://webhook.test', webhookSecret: 'sec' } as any,
    });

    const job = { name: 'alert', data: { numberId, errorType: 'NETWORK_ERROR' }, id: 'job-wh' } as any;
    await processAlertJob(job);

    const call = (globalThis as any).fetch.mock.calls[0]!;
    expect((call[1] as any).headers['X-Webhook-Secret']).toBe('sec');
    const row = await prisma.alert.findFirst({ where: { numberId } });
    expect(row?.delivered).toBe(false);
    expect(row?.deliveryError).toBe('webhook 500');
  });

  it('sends MONITOR_STATUS via custom sender and formats phone', async () => {
    const sendTextSpy = vi.fn().mockResolvedValue(true);
    vi.mocked(EvolutionClient).mockImplementation(() => {
      return { getConnect: vi.fn().mockResolvedValue({ qrBase64: undefined, pairingCode: undefined }), sendText: sendTextSpy } as any;
    });
    await prisma.project.update({ where: { id: projectId }, data: { alertPhone: '5511999999999' } });
    const sender = await prisma.number.create({
      data: { projectId, instanceName: 'sender', monitored: false, state: 'CONNECTED' } as any,
    });
    await prisma.projectConfig.update({
      where: { projectId },
      data: { alertChannels: ['MONITOR_STATUS'] as any, whatsappSender: sender.id } as any,
    });

    const job = { name: 'alert', data: { numberId, errorType: 'NETWORK_ERROR' }, id: 'job-ms' } as any;
    await processAlertJob(job);

    expect(sendTextSpy).toHaveBeenCalled();
    expect(sendTextSpy.mock.calls[0]![1]).toBe('+5511999999999');
    await prisma.project.update({ where: { id: projectId }, data: { alertPhone: '+5511999999999' } });
  });

  it('sends MONITOR_STATUS via PilotStatus with opt-in (LIVE)', async () => {
    process.env.NEXTAUTH_URL = 'http://localhost:3000';
    process.env.MONITOR_STATUS_API_KEY = 'ps_live_test';
    process.env.MONITOR_STATUS_TEMPLATE_ID = 'tpl';
    resetEnvCacheForTests();

    pilotCheckOptIn.mockResolvedValue({ authorized: true });
    pilotSend.mockResolvedValue({ id: 'msg-1' });
    await prisma.projectConfig.update({
      where: { projectId },
      data: { alertChannels: ['MONITOR_STATUS'] as any, whatsappSender: 'pilot_status' } as any,
    });

    const job = { name: 'alert', data: { numberId, errorType: 'NETWORK_ERROR' }, id: 'job-ps' } as any;
    await processAlertJob(job);

    expect(pilotSend).toHaveBeenCalled();
  });

  it('renders advanced template for EMAIL when cloud advanced alerts is enabled', async () => {
    process.env.CLOUD_ADVANCED_ALERTS = 'true';
    resetEnvCacheForTests();
    await prisma.projectConfig.update({
      where: { projectId },
      data: { alertTemplate: 'Projeto {{projectName}} / Instância {{instanceName}} / {{errorType}}' } as any,
    });

    const createTransportSpy = vi.mocked((nodemailer as any).createTransport);
    const sendMailSpy = vi.fn().mockResolvedValue(true);
    createTransportSpy.mockReturnValue({ sendMail: sendMailSpy } as any);

    const job = { name: 'alert', data: { numberId, errorType: 'NETWORK_ERROR' }, id: 'job-advanced-template' } as any;
    await processAlertJob(job);

    const payload = sendMailSpy.mock.calls[0]![0] as any;
    expect(payload.text).toContain('Projeto Alert Project / Instância test-alert-instance / NETWORK_ERROR');
  });

  it('falls back to default text when advanced template rendering throws', async () => {
    process.env.CLOUD_ADVANCED_ALERTS = 'true';
    resetEnvCacheForTests();
    await prisma.projectConfig.update({
      where: { projectId },
      data: { alertTemplate: 'Template {{projectName}}' } as any,
    });

    const createTransportSpy = vi.mocked((nodemailer as any).createTransport);
    const sendMailSpy = vi.fn().mockResolvedValue(true);
    createTransportSpy.mockReturnValue({ sendMail: sendMailSpy } as any);

    const originalReplace = String.prototype.replace;
    const replaceSpy = vi.spyOn(String.prototype as any, 'replace').mockImplementation(function (this: string, pattern: any, replacement: any) {
      if (this === 'Template {{projectName}}') {
        throw new Error('template explode');
      }
      return originalReplace.call(this, pattern, replacement);
    });

    try {
      const job = { name: 'alert', data: { numberId, errorType: 'NETWORK_ERROR' }, id: 'job-advanced-template-fallback' } as any;
      await processAlertJob(job);
    } finally {
      replaceSpy.mockRestore();
    }

    const payload = sendMailSpy.mock.calls[0]![0] as any;
    expect(payload.text).toContain('Reconnect if needed.');
  });

  it('continues alert flow when QR connect fetch fails', async () => {
    const getConnectSpy = vi.fn().mockRejectedValue(new Error('connect fail'));
    vi.mocked(EvolutionClient).mockImplementation(() => {
      return {
        getConnect: getConnectSpy,
        sendText: vi.fn().mockResolvedValue(true),
      } as any;
    });

    const createTransportSpy = vi.mocked((nodemailer as any).createTransport);
    const sendMailSpy = vi.fn().mockResolvedValue(true);
    createTransportSpy.mockReturnValue({ sendMail: sendMailSpy } as any);

    const job = { name: 'alert', data: { numberId, errorType: 'NETWORK_ERROR' }, id: 'job-qr-optional' } as any;
    await processAlertJob(job);

    expect(getConnectSpy).toHaveBeenCalled();
    expect(sendMailSpy).toHaveBeenCalled();
  });

  it('skips custom sender when it is not connected', async () => {
    await prisma.project.update({ where: { id: projectId }, data: { alertPhone: '5511999999999' } });
    const sender = await prisma.number.create({
      data: { projectId, instanceName: 'sender-offline', monitored: false, state: 'ERROR' } as any,
    });
    await prisma.projectConfig.update({
      where: { projectId },
      data: { alertChannels: ['MONITOR_STATUS'] as any, whatsappSender: sender.id } as any,
    });

    const job = { name: 'alert', data: { numberId, errorType: 'NETWORK_ERROR' }, id: 'job-ms-offline' } as any;
    await processAlertJob(job);

    const rows = await prisma.alert.findMany({ where: { numberId, channel: 'MONITOR_STATUS' as any } });
    expect(rows.length).toBe(0);
  });

  it('falls back after custom sender fails and skips when API key is missing', async () => {
    const sendTextSpy = vi.fn().mockRejectedValue(new Error('send fail'));
    vi.mocked(EvolutionClient).mockImplementation(() => {
      return { getConnect: vi.fn().mockResolvedValue({ qrBase64: undefined, pairingCode: undefined }), sendText: sendTextSpy } as any;
    });
    await prisma.project.update({ where: { id: projectId }, data: { alertPhone: '5511999999999' } });
    const sender = await prisma.number.create({
      data: { projectId, instanceName: 'sender-fail', monitored: false, state: 'CONNECTED' } as any,
    });
    await prisma.projectConfig.update({
      where: { projectId },
      data: { alertChannels: ['MONITOR_STATUS'] as any, whatsappSender: sender.id } as any,
    });

    const job = { name: 'alert', data: { numberId, errorType: 'NETWORK_ERROR' }, id: 'job-ms-custom-fail' } as any;
    await processAlertJob(job);

    expect(sendTextSpy).toHaveBeenCalled();
    const rows = await prisma.alert.findMany({ where: { numberId, channel: 'MONITOR_STATUS' as any } });
    expect(rows.length).toBe(1);
    expect(rows[0]?.delivered).toBe(false);
  });

  it('skips monitor status when project has no alert phone', async () => {
    await prisma.project.update({ where: { id: projectId }, data: { alertPhone: null } });
    await prisma.projectConfig.update({
      where: { projectId },
      data: { alertChannels: ['MONITOR_STATUS'] as any, whatsappSender: 'pilot_status' } as any,
    });

    const job = { name: 'alert', data: { numberId, errorType: 'NETWORK_ERROR' }, id: 'job-no-phone' } as any;
    await processAlertJob(job);

    const rows = await prisma.alert.findMany({ where: { numberId, channel: 'MONITOR_STATUS' as any } });
    expect(rows.length).toBe(0);
  });

  it('sends resolved EMAIL alert and writes resolved log', async () => {
    const createTransportSpy = vi.mocked((nodemailer as any).createTransport);
    const sendMailSpy = vi.fn().mockResolvedValue(true);
    createTransportSpy.mockReturnValue({ sendMail: sendMailSpy } as any);

    const job = { name: 'alert-resolved', data: { numberId }, id: 'job-resolved' } as any;
    await processAlertJob(job);

    expect(sendMailSpy).toHaveBeenCalled();
    const payload = sendMailSpy.mock.calls[0]![0] as any;
    expect(payload.subject).toContain('[OK]');
    expect(payload.text).toContain('is healthy again');

    const lastLog = await prisma.log.findFirst({
      where: { numberId, event: 'alert_resolved' as any },
      orderBy: { createdAt: 'desc' },
    });
    expect(lastLog).toBeTruthy();
  });

  it('records PilotStatus delivery error on http error', async () => {
    process.env.NEXTAUTH_URL = 'http://localhost:3000';
    process.env.MONITOR_STATUS_API_KEY = 'ps_test';
    resetEnvCacheForTests();

    pilotSend.mockRejectedValue(new PilotStatusHttpError(400, { message: 'bad' }));
    await prisma.projectConfig.update({
      where: { projectId },
      data: { alertChannels: ['MONITOR_STATUS'] as any, whatsappSender: 'pilot_status' } as any,
    });

    const job = { name: 'alert', data: { numberId, errorType: 'NETWORK_ERROR' }, id: 'job-ps-fail' } as any;
    await processAlertJob(job);

    const row = await prisma.alert.findFirst({ where: { numberId } });
    expect(row?.deliveryError).toContain('HTTP 400');
  });

  it('skips PilotStatus send when opt-in is not authorized', async () => {
    process.env.NEXTAUTH_URL = 'http://localhost:3000';
    process.env.MONITOR_STATUS_API_KEY = 'ps_live_test';
    resetEnvCacheForTests();

    pilotCheckOptIn.mockResolvedValue({ authorized: false, reason: 'missing' });
    await prisma.projectConfig.update({
      where: { projectId },
      data: { alertChannels: ['MONITOR_STATUS'] as any, whatsappSender: 'pilot_status' } as any,
    });

    const job = { name: 'alert', data: { numberId, errorType: 'NETWORK_ERROR' }, id: 'job-optout' } as any;
    await processAlertJob(job);

    expect(pilotSend).not.toHaveBeenCalled();
  });

  it('continues send when opt-in check errors', async () => {
    process.env.NEXTAUTH_URL = 'http://localhost:3000';
    process.env.MONITOR_STATUS_API_KEY = 'ps_live_test';
    resetEnvCacheForTests();

    pilotCheckOptIn.mockRejectedValue(new Error('optin down'));
    pilotSend.mockResolvedValue({ id: 'msg-2' });
    await prisma.projectConfig.update({
      where: { projectId },
      data: { alertChannels: ['MONITOR_STATUS'] as any, whatsappSender: 'pilot_status' } as any,
    });

    const job = { name: 'alert', data: { numberId, errorType: 'NETWORK_ERROR' }, id: 'job-optin-error' } as any;
    await processAlertJob(job);

    expect(pilotSend).toHaveBeenCalled();
  });

  it('sets smtp auth when smtp user and pass are provided', async () => {
    const createTransportSpy = vi.mocked((nodemailer as any).createTransport);
    createTransportSpy.mockClear();
    await prisma.projectConfig.update({
      where: { projectId },
      data: { smtpUser: 'user', smtpPass: encryptProjectSecret('pass') as any } as any,
    });

    const job = { name: 'alert', data: { numberId, errorType: 'NETWORK_ERROR' }, id: 'job-auth' } as any;
    await processAlertJob(job);

    const args = createTransportSpy.mock.calls[0]![0];
    expect((args as any).auth).toEqual({ user: 'user', pass: 'pass' });
  });

  it('records EMAIL delivery error when smtp send fails', async () => {
    const createTransportSpy = vi.mocked((nodemailer as any).createTransport);
    const sendMailSpy = vi.fn().mockRejectedValue(new Error('smtp down'));
    createTransportSpy.mockReturnValue({ sendMail: sendMailSpy } as any);

    const job = { name: 'alert', data: { numberId, errorType: 'NETWORK_ERROR' }, id: 'job-email-fail' } as any;
    await processAlertJob(job);

    const row = await prisma.alert.findFirst({ where: { numberId, channel: 'EMAIL' as any } });
    expect(row?.delivered).toBe(false);
    expect(row?.deliveryError).toBe('smtp down');
  });

  it('marks WEBHOOK as delivered on success', async () => {
    (globalThis as any).fetch = vi.fn().mockResolvedValue({ ok: true, status: 200 });
    await prisma.projectConfig.update({
      where: { projectId },
      data: { alertChannels: ['WEBHOOK'] as any, webhookUrl: 'http://webhook.test', webhookSecret: null } as any,
    });

    const job = { name: 'alert', data: { numberId, errorType: 'NETWORK_ERROR' }, id: 'job-webhook-ok' } as any;
    await processAlertJob(job);

    const row = await prisma.alert.findFirst({ where: { numberId, channel: 'WEBHOOK' as any } });
    expect(row?.delivered).toBe(true);
    expect(row?.deliveryError).toBeNull();
  });

  it('logs and rethrows when alert job processing fails', async () => {
    const spy = vi.spyOn(decryptModule, 'decryptProjectSecret').mockImplementationOnce(() => {
      throw new Error('db boom');
    });
    const job = { name: 'alert', data: { numberId, errorType: 'NETWORK_ERROR' }, id: 'job-top-fail' } as any;
    try {
      await expect(processAlertJob(job)).rejects.toThrow('db boom');
    } finally {
      spy.mockRestore();
    }
  });

  it('returns early when project config is missing', async () => {
    await prisma.projectConfig.delete({
      where: { projectId },
    });

    try {
      const job = { name: 'alert', data: { numberId, errorType: 'NETWORK_ERROR' }, id: 'job-no-config' } as any;
      await processAlertJob(job);

      const row = await prisma.alert.findFirst({ where: { numberId } });
      expect(row).toBeNull();
    } finally {
      await prisma.projectConfig.create({
        data: {
          projectId,
          alertCooldown: 10,
          alertChannels: ['EMAIL'] as any,
        } as any,
      });
    }
  });

  it('creates and closes the bullmq worker', async () => {
    const connection = new Redis(process.env.REDIS_URL!, { maxRetriesPerRequest: null });
    const w = createAlertWorker(connection as any);
    await w.close();
    await connection.quit();
  });
});
