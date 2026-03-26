import { describe, expect, it } from 'vitest';
import { computeUptimeDisplayPercent } from './uptime.js';
import { NumberState } from '@monitor/shared';

describe('computeUptimeDisplayPercent', () => {
  it('returns 100 when there are no checks and state is CONNECTED', () => {
    expect(computeUptimeDisplayPercent(0, 0, NumberState.CONNECTED)).toBe(100);
  });

  it('returns 0 when there are no checks and state is DISCONNECTED', () => {
    expect(computeUptimeDisplayPercent(0, 0, NumberState.DISCONNECTED)).toBe(0);
  });

  it('returns 0 when there are no checks and state is UNKNOWN', () => {
    expect(computeUptimeDisplayPercent(0, 0, NumberState.UNKNOWN)).toBe(0);
  });

  it('calculates correct percentage', () => {
    expect(computeUptimeDisplayPercent(9, 1, NumberState.CONNECTED)).toBe(90);
    expect(computeUptimeDisplayPercent(1, 2, NumberState.CONNECTED)).toBe(33.3);
  });

  it('caps at 99.9 if state is DISCONNECTED but history is perfect', () => {
    expect(computeUptimeDisplayPercent(10, 0, NumberState.DISCONNECTED)).toBe(99.9);
  });

  it('caps at 99.9 if state is UNKNOWN but history is perfect', () => {
    expect(computeUptimeDisplayPercent(10, 0, NumberState.UNKNOWN)).toBe(99.9);
  });
});
