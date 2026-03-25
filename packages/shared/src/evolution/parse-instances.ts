/**
 * Extract instance names from Evolution API v2 or Evolution Go list responses (defensive parsing).
 */
export function parseEvolutionInstanceNames(raw: unknown): string[] {
  const names: string[] = [];
  const pushName = (o: unknown) => {
    if (!o || typeof o !== 'object') return;
    const r = o as Record<string, unknown>;
    const n = r.instanceName ?? r.name;
    if (typeof n === 'string' && n.length > 0) names.push(n);
  };
  if (Array.isArray(raw)) {
    raw.forEach(pushName);
    return [...new Set(names)];
  }
  if (raw && typeof raw === 'object') {
    const r = raw as Record<string, unknown>;
    if (Array.isArray(r.data)) {
      r.data.forEach(pushName);
    }
    if (Array.isArray(r.instance)) {
      r.instance.forEach(pushName);
    }
    if (Array.isArray(r.instances)) {
      r.instances.forEach(pushName);
    }
    pushName(raw);
  }
  return [...new Set(names)];
}
