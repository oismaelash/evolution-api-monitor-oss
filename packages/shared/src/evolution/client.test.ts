import { describe, expect, it } from 'vitest';
import { ErrorType } from '../enums.js';
import { classifyHttpError } from './client.js';

describe('classifyHttpError', () => {
  it('maps HTTP status to ErrorType', () => {
    expect(classifyHttpError(401, '')).toBe(ErrorType.AUTH_ERROR);
    expect(classifyHttpError(403, '')).toBe(ErrorType.AUTH_ERROR);
    expect(classifyHttpError(404, '')).toBe(ErrorType.INSTANCE_NOT_FOUND);
    expect(classifyHttpError(429, '')).toBe(ErrorType.RATE_LIMIT);
    expect(classifyHttpError(500, '')).toBe(ErrorType.UNKNOWN);
    expect(classifyHttpError(400, 'does not exist')).toBe(ErrorType.INSTANCE_NOT_FOUND);
  });
});
