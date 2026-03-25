import { NextRequest, NextResponse } from 'next/server';
import { NumberService } from '@/services/number.service';
import { parsePagination } from '@monitor/shared';
import { toErrorResponse } from '@/lib/http';

type Ctx = { params: Promise<{ numberId: string }> };

export async function GET(req: NextRequest, ctx: Ctx) {
  try {
    const userId = 'oss-user-id';
    const { numberId } = await ctx.params;
    const { page, limit } = parsePagination(req.nextUrl.searchParams);
    const result = await NumberService.listHealthChecks(userId, numberId, page, limit);
    return NextResponse.json(result);
  } catch (e) {
    return toErrorResponse(e);
  }
}
