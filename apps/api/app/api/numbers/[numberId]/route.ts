import { NextRequest, NextResponse } from 'next/server';
import { NumberService } from '@/services/number.service';
import { toErrorResponse } from '@/lib/http';

type Ctx = { params: Promise<{ numberId: string }> };

export async function GET(_req: NextRequest, ctx: Ctx) {
  try {
    const userId = 'oss-user-id';
    const { numberId } = await ctx.params;
    const n = await NumberService.getById(userId, numberId);
    return NextResponse.json(n);
  } catch (e) {
    return toErrorResponse(e);
  }
}

export async function PATCH(req: NextRequest, ctx: Ctx) {
  try {
    const userId = 'oss-user-id';
    const { numberId } = await ctx.params;
    const body = await req.json();
    const n = await NumberService.update(userId, numberId, body);
    return NextResponse.json(n);
  } catch (e) {
    return toErrorResponse(e);
  }
}

export async function DELETE(_req: NextRequest, ctx: Ctx) {
  try {
    const userId = 'oss-user-id';
    const { numberId } = await ctx.params;
    await NumberService.delete(userId, numberId);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return toErrorResponse(e);
  }
}
