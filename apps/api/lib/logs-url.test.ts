import { describe, expect, it } from 'vitest';
import { buildLogsHref } from './logs-url.js';

describe('buildLogsHref', () => {
  it('builds base url with no params when defaults are used', () => {
    const href = buildLogsHref({ page: 1, level: null, projectId: null, numberId: null });
    expect(href).toBe('/logs');
  });

  it('includes populated base fields', () => {
    const href = buildLogsHref({ page: 2, level: 'ERROR', projectId: 'p1', numberId: 'n1' });
    expect(href).toContain('page=2');
    expect(href).toContain('level=ERROR');
    expect(href).toContain('projectId=p1');
    expect(href).toContain('numberId=n1');
  });

  it('applies overrides, dropping nulls', () => {
    const base = { page: 2, level: 'ERROR', projectId: 'p1', numberId: 'n1' };
    const href = buildLogsHref(base, { page: 1, level: null, projectId: 'p2' });
    
    // page=1 is omitted from URL
    expect(href).not.toContain('page=');
    expect(href).not.toContain('level=');
    expect(href).toContain('projectId=p2');
    expect(href).toContain('numberId=n1'); // keeps base
  });
});
