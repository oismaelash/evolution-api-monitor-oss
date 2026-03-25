import { NextRequest, NextResponse } from 'next/server';
import { LogService } from '@/services/log.service';
import { toErrorResponse } from '@/lib/http';

export async function GET(req: NextRequest) {
  try {
    const userId = 'oss-user-id';
    const result = await LogService.listGlobal(userId, req.nextUrl.searchParams);
    return NextResponse.json(result);
  } catch (e) {
    return toErrorResponse(e);
  }
}
