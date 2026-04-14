import { NextResponse } from 'next/server';

import { AccessLockService } from '@/services/access-lock.service';
import { toErrorResponse } from '@/lib/http';

export async function GET() {
  try {
    const status = await AccessLockService.getStatus();
    return NextResponse.json(status);
  } catch (e) {
    return toErrorResponse(e);
  }
}
