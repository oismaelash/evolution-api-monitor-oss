import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { NumberService } from '@/services/number.service';
import { toErrorResponse } from '@/lib/http';

type Ctx = { params: Promise<{ numberId: string }> };

export async function GET(req: NextRequest, ctx: Ctx) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const { numberId } = await ctx.params;
    const period = (req.nextUrl.searchParams.get('period') ?? '24h') as '24h' | '7d' | '30d';
    const p = period === '7d' || period === '30d' ? period : '24h';
    const result = await NumberService.uptime(session.user.id, numberId, p);
    return NextResponse.json(result);
  } catch (e) {
    return toErrorResponse(e);
  }
}
