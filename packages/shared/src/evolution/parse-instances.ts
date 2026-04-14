/** Normalized rows from Evolution v2 `fetchInstances` or Go `instance/all` style payloads. */
export function evolutionInstanceListRows(raw: unknown): Record<string, unknown>[] {
  if (Array.isArray(raw)) {
    return raw.filter((x): x is Record<string, unknown> => x !== null && typeof x === 'object' && !Array.isArray(x));
  }
  if (raw && typeof raw === 'object') {
    const r = raw as Record<string, unknown>;
    const list = r.data ?? r.instances ?? r.instance;
    if (Array.isArray(list)) {
      return list.filter(
        (x): x is Record<string, unknown> => x !== null && typeof x === 'object' && !Array.isArray(x)
      );
    }
  }
  return [];
}

/**
 * Per-instance `token` for the given instance name (case-sensitive), or null if not found.
 */
export function parseEvolutionInstanceTokenByName(raw: unknown, instanceName: string): string | null {
  const rows = evolutionInstanceListRows(raw);
  for (const row of rows) {
    const name = row.name ?? row.instanceName;
    const token = row.token;
    if (typeof name === 'string' && name === instanceName && typeof token === 'string' && token.length > 0) {
      return token;
    }
  }
  return null;
}

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
