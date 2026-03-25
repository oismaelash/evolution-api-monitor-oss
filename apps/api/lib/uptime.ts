import { NumberState, type NumberState as NumberStateValue } from '@monitor/shared';

/**
 * Uptime is derived from HEALTHY vs UNHEALTHY checks in the window.
 * A number currently DISCONNECTED or UNKNOWN (not yet checked) must not show 100% (no checks ≠ online; all-green history ≠ connected now).
 */
export function computeUptimeDisplayPercent(
  healthy: number,
  unhealthy: number,
  state: NumberStateValue
): number {
  const total = healthy + unhealthy;
  let percent = total === 0 ? 100 : Math.round((healthy / total) * 1000) / 10;
  if (state === NumberState.DISCONNECTED || state === NumberState.UNKNOWN) {
    if (total === 0) {
      percent = 0;
    } else if (percent >= 100) {
      percent = 99.9;
    }
  }
  return percent;
}
