import { describe, expect, it, vi } from 'vitest';
import { formatNumberStateLabel } from './number-state-label.js';
import { NumberState } from '@monitor/shared';

describe('number-state-label', () => {
  const t = vi.fn().mockImplementation((pt: string, _en: string) => pt);

  it('formats known states', () => {
    expect(formatNumberStateLabel(NumberState.CONNECTED, t)).toBe('Conectado');
    expect(formatNumberStateLabel(NumberState.DISCONNECTED, t)).toBe('Desconectado');
    expect(formatNumberStateLabel(NumberState.UNKNOWN, t)).toBe('Desconhecido');
    expect(formatNumberStateLabel(NumberState.CONNECTING, t)).toBe('Conectando');
    expect(formatNumberStateLabel(NumberState.RESTARTING, t)).toBe('Reiniciando');
    expect(formatNumberStateLabel(NumberState.ERROR, t)).toBe('Erro');
  });

  it('returns raw string for unknown states', () => {
    expect(formatNumberStateLabel('FAKE_STATE', t)).toBe('FAKE_STATE');
  });
});
