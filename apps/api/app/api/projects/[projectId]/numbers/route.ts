import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { NumberService } from '@/services/number.service';
import { parsePagination } from '@pilot/shared';
import { toErrorResponse } from '@/lib/http';

type Ctx = { params: { projectId: string } };

export async function GET(req: NextRequest, ctx: Ctx) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const { projectId } = ctx.params;
    const { page, limit } = parsePagination(req.nextUrl.searchParams);
    const result = await NumberService.listByProject(session.user.id, projectId, page, limit);
    return NextResponse.json(result);
  } catch (e) {
    return toErrorResponse(e);
  }
}

export async function POST(req: NextRequest, ctx: Ctx) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const { projectId } = ctx.params;
    const body = await req.json();
    const n = await NumberService.addManual(session.user.id, projectId, body);
    return NextResponse.json(n, { status: 201 });
  } catch (e) {
    return toErrorResponse(e);
  }
}
