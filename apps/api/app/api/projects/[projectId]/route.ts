import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { ProjectService } from '@/services/project.service';
import { toErrorResponse } from '@/lib/http';

type Ctx = { params: Promise<{ projectId: string }> };

export async function GET(_req: NextRequest, ctx: Ctx) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const { projectId } = await ctx.params;
    const project = await ProjectService.getById(session.user.id, projectId);
    return NextResponse.json(project);
  } catch (e) {
    return toErrorResponse(e);
  }
}

export async function PATCH(req: NextRequest, ctx: Ctx) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const { projectId } = await ctx.params;
    const body = await req.json();
    const project = await ProjectService.update(session.user.id, projectId, body);
    return NextResponse.json(project);
  } catch (e) {
    return toErrorResponse(e);
  }
}

export async function DELETE(_req: NextRequest, ctx: Ctx) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const { projectId } = await ctx.params;
    await ProjectService.delete(session.user.id, projectId);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return toErrorResponse(e);
  }
}
