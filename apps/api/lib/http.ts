import { NextResponse } from 'next/server';
import { ZodError } from 'zod';
import { AppError } from '@monitor/shared';

export function toErrorResponse(e: unknown): NextResponse {
  const isZodLike =
    e instanceof ZodError ||
    (e != null &&
      typeof e === 'object' &&
      (e as any).name === 'ZodError' &&
      typeof (e as any).flatten === 'function');
  if (isZodLike) {
    return NextResponse.json({ error: (e as ZodError).flatten() }, { status: 400 });
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
