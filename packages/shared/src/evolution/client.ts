import { ErrorType, EvolutionFlavor } from '../enums.js';
import { parseEvolutionInstanceTokenByName } from './parse-instances.js';

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

export type EvolutionClientOptions = {
  pingTimeoutMs?: number;
  restartTimeoutMs?: number;
  /** Defaults to Evolution API v2 (Node) routes. */
  flavor?: EvolutionFlavor;
};

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

function headersApiKey(apiKey: string): Record<string, string> {
  return {
    apikey: apiKey,
    'Content-Type': 'application/json',
  };
}

function unwrapDataPayload(raw: unknown): Record<string, unknown> {
  if (raw && typeof raw === 'object' && !Array.isArray(raw)) {
    const o = raw as Record<string, unknown>;
    if (o.data && typeof o.data === 'object' && o.data !== null && !Array.isArray(o.data)) {
      return o.data as Record<string, unknown>;
    }
    return o;
  }
  return {};
}

function getBoolCaseInsensitive(obj: Record<string, unknown>, key: string): boolean | undefined {
  const want = key.toLowerCase();
  for (const [k, v] of Object.entries(obj)) {
    if (k.toLowerCase() === want && typeof v === 'boolean') return v;
  }
  return undefined;
}

function dataUriToBase64(dataUri: string): string {
  const m = /^data:image\/png;base64,(.+)$/i.exec(dataUri.trim());
  if (m?.[1]) return m[1];
  const comma = dataUri.indexOf('base64,');
  if (comma !== -1) return dataUri.slice(comma + 7);
  return dataUri;
}

export class EvolutionClient {
  private readonly flavor: EvolutionFlavor;

  constructor(
    private readonly baseUrl: string,
    private readonly apiKey: string,
    private readonly opts?: EvolutionClientOptions
  ) {
    this.flavor = opts?.flavor ?? EvolutionFlavor.EVOLUTION_V2;
  }

  private headers(): Record<string, string> {
    return headersApiKey(this.apiKey);
  }

  private url(path: string): string {
    return `${normalizeBaseUrl(this.baseUrl)}${path}`;
  }

  async fetchInstances(): Promise<unknown> {
    const path =
      this.flavor === EvolutionFlavor.EVOLUTION_GO ? '/instance/all' : '/instance/fetchInstances';
    const res = await fetchWithTimeout(
      this.url(path),
      { headers: this.headers() },
      this.opts?.pingTimeoutMs ?? DEFAULT_PING_MS
    );
    if (!res.ok) {
      const t = await res.text();
      throw new Error(`fetchInstances failed: ${res.status} ${t}`);
    }
    return res.json() as Promise<unknown>;
  }

  /**
   * Evolution Go: resolve instance token from GET /instance/all using global API key.
   */
  private async resolveGoInstanceToken(instanceName: string): Promise<{
    token: string | null;
    rawList: unknown;
  }> {
    const res = await fetchWithTimeout(
      this.url('/instance/all'),
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
        token: null,
        rawList: { status: res.status, body: raw, errorType: classifyHttpError(res.status, bodyText) },
      };
    }
    const token = parseEvolutionInstanceTokenByName(raw, instanceName);
    if (token !== null) {
      return { token, rawList: raw };
    }
    return { token: null, rawList: raw };
  }

  /**
   * Resolves per-instance API token using global project key (v2: fetchInstances; Go: instance/all).
   */
  async resolveInstanceToken(instanceName: string): Promise<string | null> {
    if (this.flavor === EvolutionFlavor.EVOLUTION_GO) {
      const { token } = await this.resolveGoInstanceToken(instanceName);
      return token;
    }
    try {
      const raw = await this.fetchInstances();
      return parseEvolutionInstanceTokenByName(raw, instanceName);
    } catch {
      return null;
    }
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
   * Evolution Go: GET /instance/status with instance token as apikey.
   */
  private async checkHealthGo(instanceName: string): Promise<HealthResult> {
    const started = Date.now();
    try {
      const { token, rawList } = await this.resolveGoInstanceToken(instanceName);
      if (token === null) {
        const errMeta = rawList as Record<string, unknown>;
        const et = errMeta.errorType;
        if (typeof et === 'string' && (Object.values(ErrorType) as string[]).includes(et)) {
          return {
            ok: false,
            errorType: et as (typeof ErrorType)[keyof typeof ErrorType],
            message: 'could not list instances',
            raw: rawList,
          };
        }
        return {
          ok: false,
          errorType: ErrorType.INSTANCE_NOT_FOUND,
          message: `Evolution Go instance "${instanceName}" not found in /instance/all`,
          raw: rawList,
        };
      }

      const res = await fetchWithTimeout(
        this.url('/instance/status'),
        { headers: headersApiKey(token) },
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
          message: 'Evolution Go /instance/status failed',
          raw: { status: res.status, body: raw },
        };
      }
      const data = unwrapDataPayload(raw);
      const connected = getBoolCaseInsensitive(data, 'Connected');
      const loggedIn = getBoolCaseInsensitive(data, 'LoggedIn');
      const responseTimeMs = Date.now() - started;
      if (connected === true && loggedIn === true) {
        return { ok: true, responseTimeMs, raw: data };
      }
      return {
        ok: false,
        errorType: ErrorType.UNKNOWN,
        message: `Evolution Go status not ready (Connected=${String(connected)}, LoggedIn=${String(loggedIn)})`,
        raw: data,
      };
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

  /**
   * Dual health (v2): connectionState open + setPresence success (201).
   * Evolution Go: GET /instance/status with per-instance token.
   */
  async checkHealth(instanceName: string): Promise<HealthResult> {
    if (this.flavor === EvolutionFlavor.EVOLUTION_GO) {
      return this.checkHealthGo(instanceName);
    }
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

  async restart(instanceName: string, opts?: { instanceApiKey?: string }): Promise<void> {
    if (this.flavor === EvolutionFlavor.EVOLUTION_GO) {
      throw new Error('Evolution Go does not expose instance restart; use reconnect or pairing in the Evolution server UI.');
    }
    const enc = encodeURIComponent(instanceName);
    const apiKey =
      opts?.instanceApiKey !== undefined && opts.instanceApiKey.length > 0 ? opts.instanceApiKey : this.apiKey;
    const res = await fetchWithTimeout(
      this.url(`/instance/restart/${enc}`),
      { method: 'POST', headers: headersApiKey(apiKey) },
      this.opts?.restartTimeoutMs ?? DEFAULT_RESTART_MS
    );
    if (!res.ok) {
      const t = await res.text();
      throw new Error(`restart failed: ${res.status} ${t}`);
    }
  }

  async sendText(instanceName: string, number: string, text: string): Promise<void> {
    const enc = encodeURIComponent(instanceName);
    const body = {
      number,
      text,
      delay: 1200,
      linkPreview: false,
    };
    const res = await fetchWithTimeout(
      this.url(`/message/sendText/${enc}`),
      {
        method: 'POST',
        headers: this.headers(),
        body: JSON.stringify(body),
      },
      this.opts?.pingTimeoutMs ?? DEFAULT_PING_MS
    );
    if (!res.ok) {
      const t = await res.text();
      throw new Error(`sendText failed: ${res.status} ${t}`);
    }
  }

  /**
   * v2: GET /instance/connect/:name. Go: GET /instance/qr with instance token.
   */
  async getConnect(instanceName: string): Promise<{ qrBase64?: string; pairingCode?: string; raw: unknown }> {
    if (this.flavor === EvolutionFlavor.EVOLUTION_GO) {
      return this.getConnectGo(instanceName);
    }
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

  private async getConnectGo(instanceName: string): Promise<{
    qrBase64?: string;
    pairingCode?: string;
    raw: unknown;
  }> {
    const { token, rawList } = await this.resolveGoInstanceToken(instanceName);
    if (token === null) {
      return { raw: rawList };
    }
    const res = await fetchWithTimeout(
      this.url('/instance/qr'),
      { headers: headersApiKey(token) },
      this.opts?.pingTimeoutMs ?? DEFAULT_PING_MS
    );
    const raw = (await res.json().catch(() => ({}))) as Record<string, unknown>;
    const data = unwrapDataPayload(raw);
    let qrBase64: string | undefined;
    let pairingCode: string | undefined;
    const qrcode =
      (typeof data.Qrcode === 'string' && data.Qrcode) ||
      (typeof (data as { qrcode?: string }).qrcode === 'string' && (data as { qrcode: string }).qrcode);
    if (typeof qrcode === 'string' && qrcode.length > 0) {
      qrBase64 = dataUriToBase64(qrcode);
    }
    const code =
      (typeof data.Code === 'string' && data.Code) ||
      (typeof (data as { code?: string }).code === 'string' && (data as { code: string }).code);
    if (typeof code === 'string' && code.length > 0) {
      pairingCode = code;
    }
    return { qrBase64, pairingCode, raw };
  }
}
