import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { NumberService } from '@/services/number.service';
import { parsePagination } from '@monitor/shared';
import { toErrorResponse } from '@/lib/http';

type Ctx = { params: Promise<{ numberId: string }> };

export async function GET(req: NextRequest, ctx: Ctx) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const { numberId } = await ctx.params;
    const { page, limit } = parsePagination(req.nextUrl.searchParams);
    const result = await NumberService.listHealthChecks(session.user.id, numberId, page, limit);
    return NextResponse.json(result);
  } catch (e) {
    return toErrorResponse(e);
  }
}
