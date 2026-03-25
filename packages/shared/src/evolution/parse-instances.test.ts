import { describe, expect, it } from 'vitest';
import { parseEvolutionInstanceNames } from './parse-instances.js';

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
