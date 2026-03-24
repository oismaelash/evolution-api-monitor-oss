import { NextResponse } from 'next/server';
import { ZodError } from 'zod';
import { AppError } from '@monitor/shared';

export function toErrorResponse(e: unknown): NextResponse {
  if (e instanceof ZodError) {
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
