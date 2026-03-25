import { ErrorType } from '../enums.js';

export type HealthOk = { ok: true; responseTimeMs: number; raw?: unknown };
export type HealthErr = {
  ok: false;
  errorType: (typeof ErrorType)[keyof typeof ErrorType];
  message?: string;
  raw?: unknown;
};
export type HealthResult = HealthOk | HealthErr;

/** Matches Evolution-style states/messages (e.g. connectionState is close) without substring false positives. */
const CLOSED_CONNECTION_PATTERN =
  /\b(close|closed|connection\s+closed|conex[aã]o\s+fechada|desconectad[oa])\b/i;

/**
 * True when the health failure indicates the WhatsApp/session connection is closed or closing,
 * so the worker can skip waiting for FAILURES_BEFORE_RESTART and run restart logic immediately.
 */
export function isConnectionClosedLikeHealthFailure(result: HealthErr): boolean {
  const msg = result.message ?? '';
  if (CLOSED_CONNECTION_PATTERN.test(msg)) return true;
  const rawStr = JSON.stringify(result.raw ?? {});
  return CLOSED_CONNECTION_PATTERN.test(rawStr);
}

const DEFAULT_PING_MS = 5000;
const DEFAULT_RESTART_MS = 10_000;

async function fetchWithTimeout(
  url: string,
  init: RequestInit | undefined,
  timeoutMs: number
): Promise<Response> {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(id);
  }
}

function normalizeBaseUrl(baseUrl: string): string {
  return baseUrl.replace(/\/$/, '');
}

export function classifyHttpError(status: number, bodyText: string): (typeof ErrorType)[keyof typeof ErrorType] {
  if (status === 401 || status === 403) return ErrorType.AUTH_ERROR;
  if (status === 404) return ErrorType.INSTANCE_NOT_FOUND;
  if (status === 429) return ErrorType.RATE_LIMIT;
  if (bodyText.toLowerCase().includes('does not exist')) return ErrorType.INSTANCE_NOT_FOUND;
  return ErrorType.UNKNOWN;
}

export class EvolutionClient {
  constructor(
    private readonly baseUrl: string,
    private readonly apiKey: string,
    private readonly opts?: { pingTimeoutMs?: number; restartTimeoutMs?: number }
  ) {}

  private headers(): Record<string, string> {
    return {
      apikey: this.apiKey,
      'Content-Type': 'application/json',
    };
  }

  private url(path: string): string {
    return `${normalizeBaseUrl(this.baseUrl)}${path}`;
  }

  async fetchInstances(): Promise<unknown> {
    const res = await fetchWithTimeout(
      this.url('/instance/fetchInstances'),
      { headers: this.headers() },
      this.opts?.pingTimeoutMs ?? DEFAULT_PING_MS
    );
    if (!res.ok) {
      const t = await res.text();
      throw new Error(`fetchInstances failed: ${res.status} ${t}`);
    }
    return res.json() as Promise<unknown>;
  }

  async getConnectionState(
    instanceName: string
  ): Promise<
    | { ok: true; state: string; raw: unknown }
    | { ok: false; errorType: (typeof ErrorType)[keyof typeof ErrorType]; raw: unknown }
  > {
    const enc = encodeURIComponent(instanceName);
    const res = await fetchWithTimeout(
      this.url(`/instance/connectionState/${enc}`),
      { headers: this.headers() },
      this.opts?.pingTimeoutMs ?? DEFAULT_PING_MS
    );
    const text = await res.text();
    let raw: unknown = {};
    try {
      raw = JSON.parse(text) as unknown;
    } catch {
      raw = { body: text };
    }
    if (!res.ok) {
      const bodyText = typeof raw === 'object' && raw !== null ? JSON.stringify(raw) : text;
      return {
        ok: false,
        errorType: classifyHttpError(res.status, bodyText),
        raw: { status: res.status, body: raw },
      };
    }
    const obj = raw as Record<string, unknown>;
    let state = 'unknown';
    if (typeof obj.state === 'string') state = obj.state;
    else if (obj.instance && typeof obj.instance === 'object' && obj.instance !== null) {
      const inst = obj.instance as Record<string, unknown>;
      if (typeof inst.state === 'string') state = inst.state;
    }
    return { ok: true, state: state.toLowerCase(), raw };
  }

  async setPresence(instanceName: string): Promise<{ ok: boolean; raw: unknown }> {
    const enc = encodeURIComponent(instanceName);
    const res = await fetchWithTimeout(
      this.url(`/instance/setPresence/${enc}`),
      {
        method: 'POST',
        headers: this.headers(),
        body: JSON.stringify({ presence: 'available' }),
      },
      this.opts?.pingTimeoutMs ?? DEFAULT_PING_MS
    );
    const raw = (await res.json().catch(() => ({}))) as unknown;
    if (res.status === 201) return { ok: true, raw };
    const text = JSON.stringify(raw);
    if (res.status >= 400 && res.status < 500) {
      return { ok: false, raw };
    }
    if (typeof raw === 'object' && raw !== null && JSON.stringify(raw).toLowerCase().includes('close')) {
      return { ok: false, raw };
    }
    return { ok: res.ok, raw };
  }

  /**
   * Dual health: connectionState open + setPresence success (201).
   */
  async checkHealth(instanceName: string): Promise<HealthResult> {
    const started = Date.now();
    try {
      const cs = await this.getConnectionState(instanceName);
      if (!cs.ok) {
        return {
          ok: false,
          errorType: cs.errorType,
          message: 'connectionState request failed',
          raw: cs.raw,
        };
      }
      if (cs.state !== 'open') {
        return {
          ok: false,
          errorType: ErrorType.UNKNOWN,
          message: `connectionState is ${cs.state}`,
          raw: cs.raw,
        };
      }
      const pr = await this.setPresence(instanceName);
      const responseTimeMs = Date.now() - started;
      if (!pr.ok) {
        return {
          ok: false,
          errorType: ErrorType.UNKNOWN,
          message: 'setPresence did not succeed',
          raw: pr.raw,
        };
      }
      return { ok: true, responseTimeMs, raw: pr.raw };
    } catch (e) {
      const err = e as Error;
      const name = err?.name ?? '';
      const msg = err?.message ?? String(e);
      if (name === 'AbortError' || msg.includes('aborted')) {
        return { ok: false, errorType: ErrorType.NETWORK_ERROR, message: 'timeout', raw: { msg } };
      }
      return { ok: false, errorType: ErrorType.NETWORK_ERROR, message: msg, raw: { msg } };
    }
  }

  async restart(instanceName: string): Promise<void> {
    const enc = encodeURIComponent(instanceName);
    const res = await fetchWithTimeout(
      this.url(`/instance/restart/${enc}`),
      { method: 'POST', headers: this.headers() },
      this.opts?.restartTimeoutMs ?? DEFAULT_RESTART_MS
    );
    if (!res.ok) {
      const t = await res.text();
      throw new Error(`restart failed: ${res.status} ${t}`);
    }
  }

  async getConnect(instanceName: string): Promise<{ qrBase64?: string; pairingCode?: string; raw: unknown }> {
    const enc = encodeURIComponent(instanceName);
    const res = await fetchWithTimeout(
      this.url(`/instance/connect/${enc}`),
      { headers: this.headers() },
      this.opts?.pingTimeoutMs ?? DEFAULT_PING_MS
    );
    const raw = (await res.json().catch(() => ({}))) as Record<string, unknown>;
    let qrBase64: string | undefined;
    let pairingCode: string | undefined;
    if (typeof raw.base64 === 'string') qrBase64 = raw.base64;
    if (typeof raw.pairingCode === 'string') pairingCode = raw.pairingCode;
    if (raw.qrcode && typeof raw.qrcode === 'object' && raw.qrcode !== null) {
      const q = raw.qrcode as Record<string, unknown>;
      if (typeof q.base64 === 'string') qrBase64 = q.base64;
    }
    return { qrBase64, pairingCode, raw };
  }
}
