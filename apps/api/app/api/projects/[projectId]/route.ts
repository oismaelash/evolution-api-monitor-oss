import { NextRequest, NextResponse } from 'next/server';
import { ProjectService } from '@/services/project.service';
import { toErrorResponse } from '@/lib/http';

type Ctx = { params: Promise<{ projectId: string }> };

export async function GET(_req: NextRequest, ctx: Ctx) {
  try {
    const userId = 'oss-user-id';
    const { projectId } = await ctx.params;
    const project = await ProjectService.getById(userId, projectId);
    return NextResponse.json(project);
  } catch (e) {
    return toErrorResponse(e);
  }
}

export async function PATCH(req: NextRequest, ctx: Ctx) {
  try {
    const userId = 'oss-user-id';
    const { projectId } = await ctx.params;
    const body = await req.json();
    const project = await ProjectService.update(userId, projectId, body);
    return NextResponse.json(project);
  } catch (e) {
    return toErrorResponse(e);
  }
}

export async function DELETE(_req: NextRequest, ctx: Ctx) {
  try {
    const userId = 'oss-user-id';
    const { projectId } = await ctx.params;
    await ProjectService.delete(userId, projectId);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return toErrorResponse(e);
  }
}
