import { describe, expect, it, vi } from 'vitest';
import { ErrorType, EvolutionFlavor } from '../enums.js';
import { classifyHttpError, EvolutionClient, isConnectionClosedLikeHealthFailure } from './client.js';

describe('classifyHttpError', () => {
  it('maps HTTP status to ErrorType', () => {
    expect(classifyHttpError(401, '')).toBe(ErrorType.AUTH_ERROR);
    expect(classifyHttpError(403, '')).toBe(ErrorType.AUTH_ERROR);
    expect(classifyHttpError(404, '')).toBe(ErrorType.INSTANCE_NOT_FOUND);
    expect(classifyHttpError(429, '')).toBe(ErrorType.RATE_LIMIT);
    expect(classifyHttpError(500, '')).toBe(ErrorType.UNKNOWN);
    expect(classifyHttpError(400, 'does not exist')).toBe(ErrorType.INSTANCE_NOT_FOUND);
  });
});

describe('isConnectionClosedLikeHealthFailure', () => {
  it('matches closed connection phrases', () => {
    expect(isConnectionClosedLikeHealthFailure({ ok: false, errorType: ErrorType.UNKNOWN, message: 'connection closed', raw: {} })).toBe(true);
    expect(isConnectionClosedLikeHealthFailure({ ok: false, errorType: ErrorType.UNKNOWN, message: 'socket closed', raw: {} })).toBe(true);
    expect(isConnectionClosedLikeHealthFailure({ ok: false, errorType: ErrorType.UNKNOWN, message: 'close', raw: {} })).toBe(true);
    expect(isConnectionClosedLikeHealthFailure({ ok: false, errorType: ErrorType.UNKNOWN, raw: { error: 'socket closed' } })).toBe(true);
    expect(isConnectionClosedLikeHealthFailure({ ok: false, errorType: ErrorType.UNKNOWN, message: 'timeout' })).toBe(false);
  });
});

describe('EvolutionClient', () => {
  const v2Client = new EvolutionClient('http://test', 'key');
  const goClient = new EvolutionClient('http://test', 'key', { flavor: EvolutionFlavor.EVOLUTION_GO });

  it('fetchInstances fetches arrays of instances', async () => {
    (globalThis as any).fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => [{ instance: { instanceName: 'inst1' } }],
    });
    const res = await v2Client.fetchInstances();
    expect(Array.isArray(res)).toBe(true);
  });

  it('fetchInstances handles non-ok response', async () => {
    (globalThis as any).fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 401,
      text: async () => 'Unauthorized',
    });
    await expect(v2Client.fetchInstances()).rejects.toThrow(/401/);
  });



  it('checkHealth handles network abort error', async () => {
    const fetchSpy = vi.fn().mockRejectedValue(new Error('aborted'));
    (globalThis as any).fetch = fetchSpy;
    
    const res = await v2Client.checkHealth('inst');
    expect(res.ok).toBe(false);
    if (!res.ok) {
      expect(res.errorType).toBe(ErrorType.NETWORK_ERROR);
    }
  });

  it('checkHealth handles network unknown error', async () => {
    const fetchSpy = vi.fn().mockRejectedValue(new Error('boom'));
    (globalThis as any).fetch = fetchSpy;
    
    const res = await v2Client.checkHealth('inst');
    expect(res.ok).toBe(false);
    if (!res.ok) {
      expect(res.errorType).toBe(ErrorType.NETWORK_ERROR);
    }
  });

  it('checkHealth returns ok true when open and setPresence succeeds', async () => {
    (globalThis as any).fetch = vi.fn()
      .mockResolvedValueOnce({
        ok: true,
        text: async () => JSON.stringify({ state: 'open' })
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 201,
        json: async () => ({})
      });
      
    const res = await v2Client.checkHealth('inst');
    expect(res.ok).toBe(true);
  });

  it('checkHealth returns ok false when state is not open', async () => {
    (globalThis as any).fetch = vi.fn()
      .mockResolvedValueOnce({
        ok: true,
        text: async () => JSON.stringify({ state: 'connecting' })
      });
      
    const res = await v2Client.checkHealth('inst');
    expect(res.ok).toBe(false);
  });

  it('checkHealth parses connection state from nested instance obj', async () => {
    (globalThis as any).fetch = vi.fn()
      .mockResolvedValueOnce({
        ok: true,
        text: async () => JSON.stringify({ instance: { state: 'connecting' } })
      });
      
    const res = await v2Client.checkHealth('inst');
    expect(res.ok).toBe(false);
  });

  it('checkHealth returns ok false when connectionState fails', async () => {
    (globalThis as any).fetch = vi.fn()
      .mockResolvedValueOnce({
        ok: false,
        status: 404,
        text: async () => JSON.stringify({ message: 'not found' })
      });
      
    const res = await v2Client.checkHealth('inst');
    expect(res.ok).toBe(false);
  });

  it('checkHealth returns ok false when connectionState fails with non-JSON text', async () => {
    (globalThis as any).fetch = vi.fn()
      .mockResolvedValueOnce({
        ok: false,
        status: 500,
        text: async () => 'internal error'
      });
      
    const res = await v2Client.checkHealth('inst');
    expect(res.ok).toBe(false);
  });

  it('checkHealth returns ok false when setPresence fails', async () => {
    (globalThis as any).fetch = vi.fn()
      .mockResolvedValueOnce({
        ok: true,
        text: async () => JSON.stringify({ state: 'open' })
      })
      .mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => ({})
      });
      
    const res = await v2Client.checkHealth('inst');
    expect(res.ok).toBe(false);
  });

  it('checkHealth returns ok false when setPresence body indicates close', async () => {
    (globalThis as any).fetch = vi.fn()
      .mockResolvedValueOnce({
        ok: true,
        text: async () => JSON.stringify({ state: 'open' })
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ message: 'connection closed' })
      });
      
    const res = await v2Client.checkHealth('inst');
    expect(res.ok).toBe(false);
  });

  it('checkHealthGo returns connected and loggedIn', async () => {
    (globalThis as any).fetch = vi.fn()
      .mockResolvedValueOnce({
        ok: true,
        text: async () => JSON.stringify([{ instanceName: 'inst', token: 't' }]),
      })
      .mockResolvedValueOnce({
        ok: true,
        text: async () => JSON.stringify({ data: { connected: true, loggedIn: true } }),
      });
      
    const res = await goClient.checkHealth('inst');
    expect(res.ok).toBe(true);
  });

  it('checkHealthGo handles not found token', async () => {
    (globalThis as any).fetch = vi.fn()
      .mockResolvedValueOnce({
        ok: true,
        text: async () => JSON.stringify([]),
      });
      
    const res = await goClient.checkHealth('inst');
    expect(res.ok).toBe(false);
  });

  it('checkHealthGo handles token resolution error from /instance/all', async () => {
    (globalThis as any).fetch = vi.fn()
      .mockResolvedValueOnce({
        ok: false,
        status: 401,
        text: async () => JSON.stringify({ errorType: ErrorType.AUTH_ERROR }),
      });
      
    const res = await goClient.checkHealth('inst');
    expect(res.ok).toBe(false);
    if (!res.ok) {
      expect(res.errorType).toBe(ErrorType.AUTH_ERROR);
    }
  });

  it('checkHealthGo handles token resolution error with non-JSON text', async () => {
    (globalThis as any).fetch = vi.fn()
      .mockResolvedValueOnce({
        ok: false,
        status: 500,
        text: async () => 'internal error',
      });
      
    const res = await goClient.checkHealth('inst');
    expect(res.ok).toBe(false);
  });

  it('checkHealthGo handles nested instances object list', async () => {
    (globalThis as any).fetch = vi.fn()
      .mockResolvedValueOnce({
        ok: true,
        text: async () => JSON.stringify({ data: [{ instanceName: 'inst', token: 't' }] }),
      })
      .mockResolvedValueOnce({
        ok: true,
        text: async () => JSON.stringify({ data: { connected: true, loggedIn: true } }),
      });
      
    const res = await goClient.checkHealth('inst');
    expect(res.ok).toBe(true);
  });

  it('checkHealthGo handles instances array wrapper object list', async () => {
    (globalThis as any).fetch = vi.fn()
      .mockResolvedValueOnce({
        ok: true,
        text: async () => JSON.stringify({ instances: [{ instanceName: 'inst', token: 't' }] }),
      })
      .mockResolvedValueOnce({
        ok: true,
        text: async () => JSON.stringify({ data: { connected: true, loggedIn: true } }),
      });
      
    const res = await goClient.checkHealth('inst');
    expect(res.ok).toBe(true);
  });

  it('checkHealthGo handles failed instance status fetch', async () => {
    (globalThis as any).fetch = vi.fn()
      .mockResolvedValueOnce({
        ok: true,
        text: async () => JSON.stringify([{ instanceName: 'inst', token: 't' }]),
      })
      .mockResolvedValueOnce({
        ok: false,
        status: 404,
        text: async () => JSON.stringify({ message: 'not found' }),
      });
      
    const res = await goClient.checkHealth('inst');
    expect(res.ok).toBe(false);
  });

  it('checkHealthGo handles instance status fetch with non-JSON text', async () => {
    (globalThis as any).fetch = vi.fn()
      .mockResolvedValueOnce({
        ok: true,
        text: async () => JSON.stringify([{ instanceName: 'inst', token: 't' }]),
      })
      .mockResolvedValueOnce({
        ok: false,
        status: 500,
        text: async () => 'internal error',
      });
      
    const res = await goClient.checkHealth('inst');
    expect(res.ok).toBe(false);
  });

  it('checkHealthGo returns false if connected is false', async () => {
    (globalThis as any).fetch = vi.fn()
      .mockResolvedValueOnce({
        ok: true,
        text: async () => JSON.stringify([{ instanceName: 'inst', token: 't' }]),
      })
      .mockResolvedValueOnce({
        ok: true,
        text: async () => JSON.stringify({ data: { connected: false, loggedIn: false } }),
      });
      
    const res = await goClient.checkHealth('inst');
    expect(res.ok).toBe(false);
  });

  it('checkHealthGo handles network abort error', async () => {
    (globalThis as any).fetch = vi.fn()
      .mockResolvedValueOnce({
        ok: true,
        text: async () => JSON.stringify([{ instanceName: 'inst', token: 't' }]),
      })
      .mockRejectedValueOnce(new Error('aborted'));
      
    const res = await goClient.checkHealth('inst');
    expect(res.ok).toBe(false);
  });

  it('restart throws on Evolution Go', async () => {
    await expect(goClient.restart('inst')).rejects.toThrow(/Evolution Go does not expose instance restart/);
  });

  it('restart sends post for V2', async () => {
    const fetchSpy = vi.fn().mockResolvedValue({ ok: true });
    (globalThis as any).fetch = fetchSpy;
    await v2Client.restart('inst');
    expect(fetchSpy.mock.calls[0]![0]).toBe('http://test/instance/restart/inst');
  });

  it('restart handles non-ok response', async () => {
    (globalThis as any).fetch = vi.fn().mockResolvedValue({ ok: false, status: 500, text: async () => 'error' });
    await expect(v2Client.restart('inst')).rejects.toThrow(/restart failed/);
  });

  it('sendText posts body', async () => {
    const fetchSpy = vi.fn().mockResolvedValue({ ok: true });
    (globalThis as any).fetch = fetchSpy;
    await v2Client.sendText('inst', '55119', 'hello');
    expect(fetchSpy.mock.calls[0]![0]).toBe('http://test/message/sendText/inst');
  });

  it('sendText handles non-ok response', async () => {
    (globalThis as any).fetch = vi.fn().mockResolvedValue({ ok: false, status: 500, text: async () => 'error' });
    await expect(v2Client.sendText('inst', '55', 'txt')).rejects.toThrow(/sendText failed/);
  });

  it('getConnect parses QR and pairing code for v2', async () => {
    (globalThis as any).fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ base64: 'qr', pairingCode: '123' })
    });
    const res = await v2Client.getConnect('inst');
    expect(res.qrBase64).toBe('qr');
    expect(res.pairingCode).toBe('123');
  });

  it('getConnect handles nested qrcode for v2', async () => {
    (globalThis as any).fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ qrcode: { base64: 'qr-nested' } })
    });
    const res = await v2Client.getConnect('inst');
    expect(res.qrBase64).toBe('qr-nested');
  });

  it('getConnect parses QR and pairing code for go', async () => {
    (globalThis as any).fetch = vi.fn()
      .mockResolvedValueOnce({
        ok: true,
        text: async () => JSON.stringify([{ instanceName: 'inst', token: 't' }]),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: { Qrcode: 'data:image/png;base64,qrgo', Code: '456' } })
      });
    const res = await goClient.getConnect('inst');
    expect(res.qrBase64).toBe('qrgo');
    expect(res.pairingCode).toBe('456');
  });

  it('getConnect parses bare qrcode for go', async () => {
    (globalThis as any).fetch = vi.fn()
      .mockResolvedValueOnce({
        ok: true,
        text: async () => JSON.stringify([{ instanceName: 'inst', token: 't' }]),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ qrcode: 'data:image/png;base64,bareqrgo', code: '789' })
      });
    const res = await goClient.getConnect('inst');
    expect(res.qrBase64).toBe('bareqrgo');
    expect(res.pairingCode).toBe('789');
  });

  it('getConnect for go returns raw list if token missing', async () => {
    (globalThis as any).fetch = vi.fn().mockResolvedValueOnce({
      ok: true,
      text: async () => JSON.stringify([]),
    });
    const res = await goClient.getConnect('inst');
    expect(res.qrBase64).toBeUndefined();
  });
});
