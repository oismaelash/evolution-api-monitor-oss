import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { syncInstancesApplySchema } from '@monitor/shared';
import { authOptions } from '@/lib/auth';
import { NumberService } from '@/services/number.service';
import { toErrorResponse } from '@/lib/http';

type Ctx = { params: Promise<{ projectId: string }> };

export async function GET(_req: NextRequest, ctx: Ctx) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const { projectId } = await ctx.params;
    const result = await NumberService.previewSyncFromEvolution(session.user.id, projectId);
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
    const { projectId } = await ctx.params;
    const body = await req.json().catch(() => ({}));
    const parsed = syncInstancesApplySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }
    const result = await NumberService.applySyncFromEvolution(
      session.user.id,
      projectId,
      parsed.data.instanceNames,
    );
    return NextResponse.json(result);
  } catch (e) {
    return toErrorResponse(e);
  }
}
