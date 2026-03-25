import { ErrorType as ErrorTypeConst, type ErrorType } from './enums.js';

/**
 * JSON body POSTed to `webhookUrl` by the alert worker (`apps/worker/src/jobs/alert.ts`).
 * Optional fields may be omitted when empty / not applicable.
 */
export type WebhookAlertPayload = {
  instanceName: string;
  projectName: string;
  /** Omitted when `resolved` is true. */
  errorType?: ErrorType;
  /** Present when Evolution returns a QR during failure handling (can be large). */
  qrCodeBase64?: string;
  pairingCode?: string;
  /** `true` when the number is healthy again; otherwise failure alert. */
  resolved?: boolean;
};

/** Headers sent with the webhook POST (when configured). */
export const WEBHOOK_ALERT_REQUEST_HEADERS = {
  contentType: 'application/json',
  /** Sent only when a webhook secret is configured in project alert settings. */
  secretHeaderName: 'X-Webhook-Secret',
} as const;

function exampleFailure(): WebhookAlertPayload {
  return {
    instanceName: 'my-instance',
    projectName: 'My project',
    errorType: ErrorTypeConst.NETWORK_ERROR,
    qrCodeBase64: '<optional base64 when QR is available>',
    pairingCode: '<optional>',
    resolved: false,
  };
}

function exampleResolved(): WebhookAlertPayload {
  return {
    instanceName: 'my-instance',
    projectName: 'My project',
    resolved: true,
  };
}

export function getWebhookAlertPayloadExampleStrings(): {
  failure: string;
  resolved: string;
} {
  return {
    failure: JSON.stringify(exampleFailure(), null, 2),
    resolved: JSON.stringify(exampleResolved(), null, 2),
  };
}
