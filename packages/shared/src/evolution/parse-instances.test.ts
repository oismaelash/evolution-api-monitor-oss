import { describe, expect, it } from 'vitest';
import { parseEvolutionInstanceNames, parseEvolutionInstanceTokenByName } from './parse-instances.js';

describe('parseEvolutionInstanceTokenByName', () => {
  it('returns token from root array by instanceName', () => {
    const raw = [{ instanceName: 'a', token: 't1' }];
    expect(parseEvolutionInstanceTokenByName(raw, 'a')).toBe('t1');
    expect(parseEvolutionInstanceTokenByName(raw, 'b')).toBeNull();
  });

  it('returns token from data array by name', () => {
    const raw = { data: [{ name: 'n1', token: 'tok' }] };
    expect(parseEvolutionInstanceTokenByName(raw, 'n1')).toBe('tok');
  });

  it('returns token from instances envelope', () => {
    const raw = { instances: [{ instanceName: 'x', token: 'xt' }] };
    expect(parseEvolutionInstanceTokenByName(raw, 'x')).toBe('xt');
  });

  it('is case-sensitive on instance name', () => {
    const raw = [{ instanceName: 'Case', token: 'c' }];
    expect(parseEvolutionInstanceTokenByName(raw, 'case')).toBeNull();
  });

  it('returns null when token missing or empty', () => {
    expect(parseEvolutionInstanceTokenByName([{ instanceName: 'a' }], 'a')).toBeNull();
    expect(parseEvolutionInstanceTokenByName([{ instanceName: 'a', token: '' }], 'a')).toBeNull();
  });
});

describe('parseEvolutionInstanceNames', () => {
  it('collects names from Evolution Go data array', () => {
    expect(
      parseEvolutionInstanceNames({
        data: [
          { name: 'a', token: 't1' },
          { name: 'b', token: 't2' },
        ],
        message: 'success',
      })
    ).toEqual(['a', 'b']);
  });

  it('collects names from v2-style instances array', () => {
    expect(
      parseEvolutionInstanceNames({
        instances: [{ instanceName: 'x' }, { instanceName: 'y' }],
      })
    ).toEqual(['x', 'y']);
  });

  it('deduplicates', () => {
    expect(
      parseEvolutionInstanceNames({
        data: [{ name: 'dup' }, { name: 'dup' }],
      })
    ).toEqual(['dup']);
  });
});
