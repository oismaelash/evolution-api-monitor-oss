import { NextRequest, NextResponse } from 'next/server';
import { NumberService } from '@/services/number.service';
import { toErrorResponse } from '@/lib/http';

type Ctx = { params: Promise<{ numberId: string }> };

export async function GET(req: NextRequest, ctx: Ctx) {
  try {
    const userId = 'oss-user-id';
    const { numberId } = await ctx.params;
    const period = (req.nextUrl.searchParams.get('period') ?? '24h') as '24h' | '7d' | '30d';
    const p = period === '7d' || period === '30d' ? period : '24h';
    const result = await NumberService.uptime(userId, numberId, p);
    return NextResponse.json(result);
  } catch (e) {
    return toErrorResponse(e);
  }
}
