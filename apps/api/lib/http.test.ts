import { describe, expect, it, vi } from 'vitest';
import { toErrorResponse } from './http.js';
import { AppError } from '@monitor/shared';
import { ZodError } from 'zod';

vi.mock('next/server', () => ({
  NextResponse: {
    json: vi.fn((body, init) => ({ body, status: init?.status || 200 })),
  },
}));

describe('toErrorResponse', () => {
  it('handles standard Error', () => {
    const res = toErrorResponse(new Error('boom')) as any;
    expect(res.status).toBe(500);
    expect(res.body.error).toBe('Internal server error');
    expect(res.body.detail).toBe('boom');
  });

  it('handles AppError', () => {
    const res = toErrorResponse(new AppError('UNKNOWN', 'not found', 404)) as any;
    expect(res.status).toBe(404);
    expect(res.body.error).toBe('not found');
    expect(res.body.code).toBe('UNKNOWN');
  });

  it('handles real ZodError', () => {
    const ze = new ZodError([{ code: 'custom', message: 'bad', path: ['x'] }]);
    const res = toErrorResponse(ze) as any;
    expect(res.status).toBe(400);
    expect(res.body.error).toBeDefined();
  });

  it('handles duck-typed ZodError (useful for different zod versions)', () => {
    const fakeZod = { name: 'ZodError', flatten: () => ({ fieldErrors: { a: ['bad'] } }) };
    const res = toErrorResponse(fakeZod) as any;
    expect(res.status).toBe(400);
    expect(res.body.error.fieldErrors.a).toContain('bad');
  });
});
