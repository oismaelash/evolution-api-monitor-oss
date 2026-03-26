import { NextResponse } from 'next/server';
import { ZodError } from 'zod';
import { AppError } from '@monitor/shared';

function isZodLikeError(e: unknown): e is { flatten: () => unknown } {
  if (e instanceof ZodError) return true;
  if (e == null || typeof e !== 'object') return false;
  const rec = e as Record<string, unknown>;
  return rec.name === 'ZodError' && typeof rec.flatten === 'function';
}

export function toErrorResponse(e: unknown): NextResponse {
  if (isZodLikeError(e)) {
    return NextResponse.json({ error: e.flatten() }, { status: 400 });
  }
  if (e instanceof AppError) {
    return NextResponse.json(
      { error: e.message, code: e.code },
      { status: e.statusCode }
    );
  }
  const err = e as Error;
  return NextResponse.json(
    { error: 'Internal server error', detail: err.message },
    { status: 500 }
  );
}
