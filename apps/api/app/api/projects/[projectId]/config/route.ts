import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { ProjectService } from '@/services/project.service';
import { toErrorResponse } from '@/lib/http';

type Ctx = { params: Promise<{ projectId: string }> };

export async function PUT(req: NextRequest, ctx: Ctx) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const { projectId } = await ctx.params;
    const body = await req.json();
    const cfg = await ProjectService.upsertConfig(session.user.id, projectId, body);
    return NextResponse.json(cfg);
  } catch (e) {
    return toErrorResponse(e);
  }
}
