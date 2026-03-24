export function logJson(
  level: 'info' | 'warn' | 'error' | 'debug',
  event: string,
  meta?: Record<string, unknown>
): void {
  const line = JSON.stringify({
    ts: new Date().toISOString(),
    level,
    event,
    service: 'worker',
    ...meta,
  });
  if (level === 'error') {
    console.error(line);
  } else {
    console.log(line);
  }
}
