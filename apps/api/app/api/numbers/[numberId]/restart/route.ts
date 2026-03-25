import { NextRequest, NextResponse } from 'next/server';
import { NumberService } from '@/services/number.service';
import { toErrorResponse } from '@/lib/http';

type Ctx = { params: Promise<{ numberId: string }> };

export async function POST(_req: NextRequest, ctx: Ctx) {
  try {
    const userId = 'oss-user-id';
    const { numberId } = await ctx.params;
    const result = await NumberService.restart(userId, numberId);
    return NextResponse.json(result);
  } catch (e) {
    return toErrorResponse(e);
  }
}
