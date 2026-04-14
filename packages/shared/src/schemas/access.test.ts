import { describe, it, expect } from 'vitest';

import { ossAccessSetupSchema, ossAccessVerifySchema } from './access.js';

describe('ossAccessSetupSchema', () => {
  it('should accept matching passwords', () => {
    const r = ossAccessSetupSchema.safeParse({
      password: '12345678',
      confirmPassword: '12345678',
    });
    expect(r.success).toBe(true);
  });

  it('should reject short password', () => {
    const r = ossAccessSetupSchema.safeParse({
      password: 'short',
      confirmPassword: 'short',
    });
    expect(r.success).toBe(false);
  });

  it('should reject mismatch', () => {
    const r = ossAccessSetupSchema.safeParse({
      password: '12345678',
      confirmPassword: '87654321',
    });
    expect(r.success).toBe(false);
  });
});

describe('ossAccessVerifySchema', () => {
  it('should accept non-empty password', () => {
    expect(ossAccessVerifySchema.safeParse({ password: 'x' }).success).toBe(true);
  });

  it('should reject empty password', () => {
    expect(ossAccessVerifySchema.safeParse({ password: '' }).success).toBe(false);
  });
});
