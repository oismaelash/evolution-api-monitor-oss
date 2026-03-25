import { NextRequest, NextResponse } from 'next/server';
import { NumberService } from '@/services/number.service';
import { parsePagination } from '@monitor/shared';
import { toErrorResponse } from '@/lib/http';

type Ctx = { params: Promise<{ projectId: string }> };

export async function GET(req: NextRequest, ctx: Ctx) {
  try {
    const userId = 'oss-user-id';
    const { projectId } = await ctx.params;
    const { page, limit } = parsePagination(req.nextUrl.searchParams);
    const result = await NumberService.listByProject(userId, projectId, page, limit);
    return NextResponse.json(result);
  } catch (e) {
    return toErrorResponse(e);
  }
}

export async function POST(req: NextRequest, ctx: Ctx) {
  try {
    const userId = 'oss-user-id';
    const { projectId } = await ctx.params;
    const body = await req.json();
    const n = await NumberService.addManual(userId, projectId, body);
    return NextResponse.json(n, { status: 201 });
  } catch (e) {
    return toErrorResponse(e);
  }
}
