import type { AlertChannel, ErrorType } from '../enums.js';

export type AlertPayload = {
  instanceName: string;
  phoneNumber?: string;
  projectName: string;
  errorType: ErrorType;
  qrCodeBase64?: string;
  pairingCode?: string;
  timestamp: Date;
};

export interface AlertProvider {
  readonly channel: AlertChannel;
  send(payload: AlertPayload, ctx: AlertProviderContext): Promise<void>;
}

export type AlertProviderContext = {
  monitorStatusApiKey?: string;
  monitorStatusBaseUrl?: string;
  alertPhoneE164?: string;
  smtpHost?: string | null;
  smtpPort?: number | null;
  smtpUser?: string | null;
  smtpPass?: string | null;
  webhookUrl?: string | null;
  webhookSecret?: string | null;
};
