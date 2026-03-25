/** Query string e links da página /logs (compartilhado entre server e client). */
export function buildLogsHref(
  base: {
    page: number;
    level: string | null | undefined;
    projectId: string | null | undefined;
    numberId: string | null | undefined;
  },
  overrides: Partial<{
    page: number;
    level: string | null;
    projectId: string | null;
    numberId: string | null;
  }> = {}
): string {
  const page = overrides.page ?? base.page;
  const level = overrides.level !== undefined ? overrides.level : base.level;
  const projectId = overrides.projectId !== undefined ? overrides.projectId : base.projectId;
  const numberId = overrides.numberId !== undefined ? overrides.numberId : base.numberId;
  const next = new URLSearchParams();
  if (page > 1) next.set('page', String(page));
  if (level) next.set('level', level);
  if (projectId) next.set('projectId', projectId);
  if (numberId) next.set('numberId', numberId);
  const s = next.toString();
  return s ? `/logs?${s}` : '/logs';
}
